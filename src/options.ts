type Operation = {
	operator: string
	operands: Array<Operand>
}
type Operand = {
	type: OperandType
	label: string
	arguments: Array<string>
}

enum OperandType {
	COMMAND,
	ACTION,
	PATTERN,
}

const parseOperationsString = (() => {
	const parseOperationNode = (nodeString: string): Operand => ({
		type: nodeString.includes("-")
			? OperandType.COMMAND
			: nodeString.includes(".") ? OperandType.ACTION : OperandType.PATTERN,
		label: nodeString.includes(",") ? nodeString.slice(0, nodeString.indexOf(",")) : nodeString,
		arguments: nodeString.includes(",") ? nodeString.slice(nodeString.indexOf(",") + 1, nodeString.indexOf(";")).split(",") : [],
	});
	
	const getFirstBreak = (nodesString: string): number =>
		nodesString.indexOf(" ") <= nodesString.indexOf(",")
			? nodesString.includes(" ") ? nodesString.indexOf(" ") : nodesString.length
			: nodesString.includes(";") ? nodesString.indexOf(";") + 1 : nodesString.indexOf(" ")
	;
	
	const parseOperationNodes = (nodesString: string): Array<Operand> => nodesString === ""
		? []
		: [ parseOperationNode(nodesString.slice(0, getFirstBreak(nodesString))) ]
			.concat(parseOperationNodes(nodesString.slice(getFirstBreak(nodesString) + 1)))
	;
	
	const parseOperation = (nodesString: string): Operation => ({
		operator: nodesString.split(" ")[0],
		operands: parseOperationNodes(nodesString.slice(nodesString.indexOf(" ") + 1)),
	});
	
	return (operationsString: string): Array<Operation> => operationsString
		.split("\n")
		.filter(operation => operation !== "" && !operation.startsWith("#"))
		.map(operation => parseOperation(operation))
	;
})();

const optionsInsert = async (container: HTMLElement) => {
	const style = document.createElement("style");
	style.textContent = `
body {
	background: hsl(0, 0%, 20%);
}
textarea {
	resize: none;
	background: black;
	color: hsl(120, 100%, 50%)
}
.modified {
	font-weight: bold;
}
	`;
	document.head.appendChild(style);
	const form = document.createElement("form");
	const textbox = document.createElement("textarea");
	textbox.value = (await chrome.storage.sync.get("operationsString"))["operationsString"];
	textbox.cols = 64;
	textbox.rows = 32;
	textbox.spellcheck = false;
	textbox.addEventListener("keydown", event => {
		if (event.ctrlKey) {
			if (event.key === "Enter") {
				event.preventDefault();
				save.click();
			}
		} else {
			save.classList.add("modified");
		}
	});
	const save = document.createElement("button");
	save.type = "submit";
	save.textContent = "Save";
	form.appendChild(textbox);
	form.appendChild(save);
	container.appendChild(form);
	form.addEventListener("submit", event => {
		event.preventDefault();
		const operationsString = textbox.value;
		chrome.storage.sync.set({ operationsString });
		chrome.storage.local.set({ operations: parseOperationsString(operationsString) });
		save.classList.remove("modified");
	});
};

optionsInsert(document.body);
