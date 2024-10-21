export default class Combinator {

	generate(node) {
		switch (node.type) {
			case 'SequenceNode':
				return this.combineNodes(node.nodes);
			case 'OptionalNode':
				const withNode = this.generate(node.node);
				const withoutNode = [{ text: '', tags: [] }];
				return withNode.concat(withoutNode);
			case 'ChoiceNode':
				let results = [];
				for (const choice of node.choices) {
					const choiceResults = this.generate(choice);
					results = results.concat(choiceResults);
				}
				return results.length > 0 ? results : [{ text: '', tags: [] }];
			case 'ParseTagNode':
				const parseResults = this.generate(node.node);
				for (const result of parseResults) {
					result.tags.push(result.text.trim());
				}
				return parseResults;
			case 'TextNode':
				return [{ text: node.text, tags: [] }];
			case 'WhitespaceNode':
				return [{ text: node.value, tags: [] }];
			default:
				throw new Error(`Unknown node type: ${node.type}`);
		}
	}

	combineNodes(nodes) {
		if (nodes.length === 0)
			return [{ text: '', tags: [] }];

		const [firstNode, ...restNodes] = nodes;
		const firstResults = this.generate(firstNode) || [{ text: '', tags: [] }];
		const restResults = this.combineNodes(restNodes) || [{ text: '', tags: [] }];

		const combinedResults = [];

		for (const firstResult of firstResults) {
			for (const restResult of restResults) {
				combinedResults.push({
					text: firstResult.text + restResult.text,
					tags: [...firstResult.tags, ...restResult.tags],
				});
			}
		}

		return combinedResults;
	}

	estimate(node) {
		switch (node.type) {
			case 'SequenceNode':
				return node.nodes.reduce((acc, child) => acc * this.estimate(child), 1);
			case 'OptionalNode':
				return this.estimate(node.node) + 1;
			case 'ChoiceNode':
				return node.choices.reduce((acc, choice) => acc + this.estimate(choice), 0);
			case 'ParseTagNode':
			case 'TextNode':
			case 'WhitespaceNode':
				return 1;
			default:
				throw new Error(`Unknown node type: ${node.type}`);
		}
	}
}
