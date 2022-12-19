let command = "";
let input: HTMLElement | null = null;

const commandEntered = async (commandNew: string) => {
	command = commandNew;
	const getTabsFocused = async () =>
		(await chrome.tabs.query({ lastFocusedWindow: true }));
	if (input) {
		input.textContent = command;
	}
	switch (command) {
	/*case "t": {
		chrome.action.setBadgeText({ text: " " });
		chrome.action.setBadgeBackgroundColor({ color: [ 255, 0, 0, 255 ] });
		return;
	} */case "tl": {
		const tabs = await getTabsFocused();
		chrome.tabs.update(tabs[(tabs.findIndex(tab => tab.active) + 1) % tabs.length].id as number, { active: true });
		break;
	} case "th": {
		const tabs = await getTabsFocused();
		chrome.tabs.update(tabs[(tabs.length + tabs.findIndex(tab => tab.active) - 1) % tabs.length].id as number, { active: true });
		break;
	} default: {
		return;
	}}
	close();
};

commandEntered("t");

addEventListener("keydown", event => {
	if (event.key === "Escape") {
		return;
	}
	event.preventDefault();
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
	close();
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
		width: 100px;
		height: 20px;
		display: flex;
		align-items: center;
	}
	`;
	document.head.appendChild(style);
	input = container.appendChild(document.createElement("span"));
	input.textContent = command;
};

popupInsert(document.body);
