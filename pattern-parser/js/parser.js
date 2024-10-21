import {
	SequenceNode,
	OptionalNode,
	ChoiceNode,
	ParseTagNode,
	TextNode,
	WhitespaceNode,
} from './astNodes.js';

export default class Parser {

	constructor(tokens) {
		this.tokens = tokens;
		this.position = 0;
	}

	parse() {
		return this.parseSequence(['EOF']);
	}

	parseSequence(endTokens) {
		const sequences = [];
		let currentSequence = [];

		while (this.position < this.tokens.length) {
			const token = this.tokens[this.position];

			if (endTokens.includes(token.type)) {
				break;
			} else if (token.type === '|') {
				this.position++;
				sequences.push(new SequenceNode(currentSequence));
				currentSequence = [];
			} else {
				currentSequence.push(this.parseElement(endTokens));
			}
		}

		if (currentSequence.length > 0) {
			sequences.push(new SequenceNode(currentSequence));
		}

		if (sequences.length > 1) {
			return new ChoiceNode(sequences);
		} else if (sequences.length === 1) {
			return sequences[0];
		} else {
			return new SequenceNode([]);
		}
	}

	parseElement() {
		const token = this.tokens[this.position];

		if (token.type === '[') {
			this.position++;
			const node = new OptionalNode(this.parseSequence([']']));
			this.expect(']');
			return node;
		} else if (token.type === '(') {
			this.position++;
			const node = this.parseSequence([')']);
			this.expect(')');
			return node;
		} else if (token.type === 'TEXT') {
			this.position++;
			return new TextNode(token.value);
		} else if (token.type === 'WHITESPACE') {
			this.position++;
			return new WhitespaceNode(token.value);
		} else if (token.type === ':') {
			this.position++;
			const parseTagNode = this.parseParseTag();
			return parseTagNode;
		} else {
			throw new Error(`Unexpected token: ${token.type}`);
		}
	}

	parseParseTag() {
		const token = this.tokens[this.position];

		if (token.type === '(') {
			this.position++;
			const tagNode = this.parseSequence([')']);
			this.expect(')');
			return new ParseTagNode(tagNode);
		} else if (token.type === 'TEXT') {
			const tagValue = token.value;
			this.position++;
			return new ParseTagNode(new TextNode(tagValue));
		} else {
			throw new Error('Invalid parse tag syntax');
		}
	}

	expect(type) {
		const token = this.tokens[this.position];
		if (token && token.type === type) {
			this.position++;
		} else {
			throw new Error(`Expected token ${type} but found ${token ? token.type : 'EOF'}`);
		}
	}
	
}
