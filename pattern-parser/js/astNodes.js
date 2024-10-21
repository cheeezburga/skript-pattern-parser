export class SequenceNode {
	constructor(nodes) {
		this.type = 'SequenceNode';
		this.nodes = nodes;
	}
}

export class OptionalNode {
	constructor(node) {
		this.type = 'OptionalNode';
		this.node = node;
	}
}

export class ChoiceNode {
	constructor(choices) {
		this.type = 'ChoiceNode';
		this.choices = choices;
	}
}

export class ParseTagNode {
	constructor(node) {
		this.type = 'ParseTagNode';
		this.node = node;
	}
}

export class TextNode {
	constructor(text) {
		this.type = 'TextNode';
		this.text = text;
	}
}

export class WhitespaceNode {
	constructor(value) {
		this.type = 'WhitespaceNode';
		this.value = value;
	}
}
