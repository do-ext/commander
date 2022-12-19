let command = "";
let input: HTMLElement | null = null;

const commandEntered = async (commandNew: string, submit = false) => {
	command = commandNew;
	const getTabsInWindow = async () =>
		(await chrome.tabs.query({ lastFocusedWindow: true }));
	if (input) {
		input.textContent = command;
	}
	if (command.startsWith("t")) {
		if ((command.length > 1 && command.endsWith("t")) || submit) {
			const tab = (await chrome.tabs.query({ highlighted: true, active: false }))[0];
			chrome.tabs.update(tab.id as number, { active: true });
			close();
			return;
		}
		const tabs = await getTabsInWindow();
		const tab = tabs.find(tab => tab.active) as chrome.tabs.Tab;
		const tabSelected = tabs.find(tab => !tab.active && tab.highlighted) as chrome.tabs.Tab;
		if (command.startsWith("tl")) {
			const shift = (command.match(/l/g) as RegExpMatchArray).length;
			chrome.tabs.update(tabs[(tab.index + shift) % tabs.length].id as number, {
				highlighted: true,
				active: false,
			});
			chrome.tabs.update(tabSelected.id as number, { highlighted: false });
		} else if (command.startsWith("th")) {
			const shift = (command.match(/h/g) as RegExpMatchArray).length;
			chrome.tabs.update(tabs[(tabs.length - 1) + ((tab.index - (tabs.length - 1) - shift) % tabs.length)].id as number, {
				highlighted: true,
				active: false,
			});
			chrome.tabs.update(tabSelected.id as number, { highlighted: false });
		}
	}
};

commandEntered("t");

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
