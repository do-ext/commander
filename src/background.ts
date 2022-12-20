chrome.commands.onCommand.addListener(command => {
	if (command.startsWith("open-popup")) {
		chrome.storage.local.set({ popupClass: command.slice("open-popup".length + 1) });
		chrome.action["openPopup"]();
	}
});
