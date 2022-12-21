window["command"] = "";

onkeydown = event => {
	if (event.key !== "Escape") {
		event.preventDefault();
	}
	if (event.key.length === 1 && event.key !== " ") {
		window["command"] += event.key;
	}
};

//chrome.storage.onChanged.addListener((changes, areaName) => {
//	if (areaName === "local" && changes.popupClass) {
//		popupClass = changes.popupClass;
//	}
//});
