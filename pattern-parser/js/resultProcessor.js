export default class ResultProcessor {
	process(results) {
		const totalPatterns = results.length;
		let longestPattern = 0;
		let shortestPattern = Infinity;
		let totalLength = 0;
		const parseTagsSet = new Set();
		
		for (const result of results) {
			const length = result.text.length;
			totalLength += length;
			if (length > longestPattern)
				longestPattern = length;
			if (length < shortestPattern)
				shortestPattern = length;

			for (const tag of result.tags) {
				parseTagsSet.add(tag);
			}
		}

		const averagePattern = totalPatterns > 0 ? (totalLength / totalPatterns).toFixed(2) : 0;
		const uniqueParseTags = Array.from(parseTagsSet);

		return {
			results,
			totalPatterns,
			longestPattern,
			shortestPattern,
			averagePattern,
			uniqueParseTags,
		};
	}
}
