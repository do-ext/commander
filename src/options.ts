const optionsInsert = async (container: HTMLElement) => {
	const style = document.createElement("style");
	style.textContent = `
	`;
	document.head.appendChild(style);
	const form = document.createElement("form");
	const input = document.createElement("textarea");
	input.textContent = await chrome.storage.sync.get("mapping")["mapping"];
	const button = document.createElement("button");
	button.textContent = "Save";
	button.type = "submit";
	form.appendChild(input);
	form.appendChild(button);
	container.appendChild(form);
	form.addEventListener("submit", () => {
		chrome.storage.sync.set({
			mapping: input.value,
		});
	});
};

optionsInsert(document.body);
