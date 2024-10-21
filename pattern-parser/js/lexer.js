export default class Lexer {

	constructor(input) {
		this.input = input;
		this.position = 0;
		this.tokens = [];
	}

	tokenize() {
		while (this.position < this.input.length) {
			const char = this.input[this.position];

			if (/\s/.test(char)) {
				this.tokens.push(this.readWhitespace());
			} else if (['[', ']', '(', ')', '|', ':'].includes(char)) {
				this.tokens.push({ type: char, value: char });
				this.position++;
			} else {
				this.tokens.push(this.readText());
			}
		}
		return this.tokens;
	}

	readWhitespace() {
		let whitespace = '';
		while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
			whitespace += this.input[this.position];
			this.position++;
		}
		return { type: 'WHITESPACE', value: whitespace };
	}

	readText() {
		let text = '';
		while (
			this.position < this.input.length &&
			!/\s/.test(this.input[this.position]) &&
			!['[', ']', '(', ')', '|', ':'].includes(this.input[this.position])
		) {
			text += this.input[this.position];
			this.position++;
		}
		return { type: 'TEXT', value: text };
	}
	
}
