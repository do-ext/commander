addEventListener("keydown", event => {
	if (event.key === "Escape") {
		return;
	}
	event.preventDefault();
	if (event.key === "Enter") {
		commandEntered(command, true);
		return;
	}
	if (event.key === "Backspace" || event.key === "Delete") {
		commandEntered("");
		return;
	}
	if (event.key.length === 1 && event.key !== " ") {
		commandEntered(command + event.key);
	}
});

onkeydown = null;

let command = window["command"] ?? "";
let input: HTMLElement | null = null;

// TODO do not rely on storage being present
let operations: Array<Operation> = [];
const operationsRetrieval = chrome.storage.local.get("operations").then(storage => {
	operations = storage["operations"];
});

let popupClass = "";
chrome.storage.local.get("popupClass").then(async storage => {
	popupClass = storage["popupClass"];
	await operationsRetrieval;
	operations.filter(operation => operation.operator === "begin" && operation.operands[0].label === popupClass).forEach(operation => {
		// TODO only use the appropriate prefix operation (corresponding to the shortcut used to open the popup)
		commandEntered(operation.operands[1].label + command);
	});
});

const getTabsInWindow = () =>
	chrome.tabs.query({ lastFocusedWindow: true })
;

const evaluateExpression = (expressionString: string): number => {
	const expression = expressionString.split(" ").map(node =>
		node === "<length>"
			? command.length
			: [ "+", "-" ].includes(node) ? node : parseInt(node)
	);
	let result = 0;
	let mode = "+";
	expression.forEach(node => {
		if (typeof node === "string") {
			mode = node;
		} else {
			switch (mode) {
			case "+": {
				result += node;
				break;
			} case "-": {
				result -= node;
				break;
			}}
		}
	});
	return result;
};

const getTabIndex = (index: number, shift: number, tabCount: number) =>
	shift >= 0
		? (index + shift) % tabCount
		: (tabCount - 1) + ((index - (tabCount - 1) + shift) % tabCount)
;

let tabInGroupId = -1;

const commandEntered = async (commandNew: string, submit = false) => {
	if (submit) {
		const operation = operations.filter(({ operator, operands }) => operator === "complete" && (new RegExp(`\\b${operands[0].label}\\b`, "g")).test(commandNew))[0];
		commandNew += operation.operands[1].label;
	}
	command = commandNew;
	if (input) {
		input.textContent = command;
	}
	const operationsApplicable = operations
		.filter(({ operator, operands }) => operator === "map" && (new RegExp(`\\b${operands[0].label}\\b`, "g")).test(command));
	for (const { operands: [ pattern, action, replacement ] } of operationsApplicable) {
		switch (action.label) {
		case "tabs.highlight.shift": {
			const tabs = await getTabsInWindow();
			const tabSelected = tabs.find(tab => !tab.active && tab.highlighted);
			const tabActiveIndex = tabs.findIndex(tab => tab.active);
			const tabIndex = getTabIndex(tabActiveIndex, evaluateExpression(action.arguments[0]), tabs.length);
			if (this.browser) {
				chrome.tabs.update(tabs[tabIndex].id as number, { highlighted: true, active: false });
				if (tabSelected) {
					chrome.tabs.update(tabSelected.id as number, { highlighted: false });
				}
			} else {
				tabInGroupId = tabs[tabIndex].id as number;
				chrome.tabGroups.query({ title: "doExt" }).then(groups => {
					groups.forEach(async ({ id: groupId }) => {
						chrome.tabs.ungroup((await chrome.tabs.query({ groupId })).map(tab => tab.id as number));
					});
				});
				chrome.tabs.group({ tabIds: tabInGroupId }).then(async value => {
					chrome.tabGroups.update(value, {
						title: "doExt",
						color: "blue",
					});
				});
			}
			break;
		} case "tabs.activate.shift": {
			const tabs = await getTabsInWindow();
			const tabIndex = getTabIndex(tabs.findIndex(tab => tab.active), evaluateExpression(action.arguments[0]), tabs.length);
			chrome.tabs.update(tabs[tabIndex].id as number, { active: true });
			break;
		} case "tabs.activate.highlighted": {
			const groupId = (await chrome.tabGroups.query({ title: "doExt" }))[0].id;
			const tab = (await chrome.tabs.query(this.browser ? { highlighted: true, active: false } : { groupId }))[0];
			chrome.tabs.update(tab.id as number, { active: true });
			if (!this.browser) {
				chrome.tabs.ungroup(tab.id as number);
			}
			break;
		} case "meta.popup.close": {
			close();
			break;
		} default: {
			console.warn("unrecognised action", action);
		}}
		if (replacement !== undefined) {
			command = replacement.label === "\"\"" ? "" : replacement.label;
			if (input) {
				input.textContent = command;
			}
		}
	}
};

addEventListener("keyup", event => {
	event.preventDefault();
	if (event.key.length === 1 && event.key !== " " && !command.includes(event.key)) {
		commandEntered(command + event.key);
	}
});

addEventListener("blur", () => {
	//close();
});

const popupInsert = (container: HTMLElement) => {
	const style = document.createElement("style");
	style.textContent = `
body {
	background: black;
	border-color: black;
	color: hsl(120 100% 50%);
	font-size: 24px;
	font-family: monospace;
	width: 116px;
	height: 20px;
	display: flex;
	align-items: center;
	user-select: none;
	overflow: clip;
}
	`;
	document.head.appendChild(style);
	input = container.appendChild(document.createElement("span"));
	input.textContent = command;
};

popupInsert(document.body);
