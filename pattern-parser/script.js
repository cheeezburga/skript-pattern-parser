import Lexer from './js/lexer.js';
import Parser from './js/parser.js';
import Combinator from './js/combinator.js';
import ResultProcessor from './js/resultProcessor.js';

let patternInput;
let tooltip;
let copyNotification;
let allData = null;
let allResults = [];
let currentPage = 1;
let totalPages = 1;
let resultsPerPage = 100;
let patternsContent;
let statsContent;
let prevPageButton;
let nextPageButton;
let currentPageInput;
let totalPagesSpan;
let displayCount;

document.addEventListener('DOMContentLoaded', () => {
	const themeToggleButton = document.getElementById('theme-toggle');
	patternInput = document.getElementById('pattern');
	patternsContent = document.getElementById('patternsContent');
	statsContent = document.getElementById('statsContent');
	prevPageButton = document.getElementById('prev-page');
	nextPageButton = document.getElementById('next-page');
	currentPageInput = document.getElementById('current-page');
	totalPagesSpan = document.getElementById('total-pages');
	displayCount = document.getElementById('display-count');

	displayCount.value = '100';

	// pattern input listener
	patternInput.addEventListener('input', debounce(parsePattern, 5));

	// possible pattern related stuff
	tooltip = document.getElementById('tooltip');
	copyNotification = document.getElementById('copy-notification');

	// theme stuff
	initializeTheme();
	themeToggleButton.addEventListener('click', toggleTheme);

	// pagination listeners
	prevPageButton.addEventListener('click', () => changePage(currentPage - 1));
	nextPageButton.addEventListener('click', () => changePage(currentPage + 1));
	currentPageInput.addEventListener('change', (e) => {
		let page = parseInt(e.target.value);
		if (isNaN(page) || page < 1) page = 1;
		if (page > totalPages) page = totalPages;
		changePage(page);
	});
	displayCount.addEventListener('change', () => {
		updateResultsPerPage();
		currentPage = 1;
		updatePagination();
		showPage(currentPage);
	});
});

// this is basically a limit on how often parsePattern should be called
function debounce(func, delay) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), delay);
	};
}

function parsePattern() {
	const pattern = patternInput.value;

	// no pattern :(
	if (!pattern.trim()) {
		patternsContent.innerText = 'Enter a pattern to get started.';
		statsContent.innerHTML = '';
		resetPagination();
		patternInput.classList.remove('input-error');
		return;
	}

	try {
		const lexer = new Lexer(pattern);
		const tokens = lexer.tokenize();

		const parser = new Parser(tokens);
		const ast = parser.parse();

		const combinator = new Combinator();
		const estimatedCombinations = combinator.estimate(ast);
		console.log('Estimated combinations: ', estimatedCombinations);

		const MAX_COMBINATIONS = 100000; // should this be configurable?

		if (estimatedCombinations > MAX_COMBINATIONS) {
			displayError('Too many combinations!');
			return;
		}

		const variants = combinator.generate(ast);

		const processor = new ResultProcessor();
		const data = processor.process(variants);

		// sort by length, looks nicer imo
		data.results.sort((a, b) => a.text.length - b.text.length);

		allData = data;
		allResults = data.results;
		currentPage = 1;

		updateResultsPerPage();
		updatePagination();
		displayStatistics();
		showPage(currentPage);
		
		patternInput.classList.remove('input-error');
	} catch (error) {
		displayError('Invalid syntax pattern!');
	}
}

function updateResultsPerPage() {
	const displayValue = displayCount.value;
	if (displayValue === 'all') {
		resultsPerPage = allResults.length;
	} else {
		const parsedValue = parseInt(displayValue);
		if (!isNaN(parsedValue) && parsedValue > 0) {
			resultsPerPage = parsedValue;
		} else {
			resultsPerPage = 10; // fallback - should never get here tho
		}
	}
}

function updatePagination() {
	totalPages = Math.ceil(allResults.length / resultsPerPage);
	if (totalPages === 0)
		totalPages = 1;
	currentPage = Math.min(currentPage, totalPages);
	updatePaginationControls();
}

function updatePaginationControls() {
	totalPagesSpan.textContent = `/ ${totalPages}`;
	currentPageInput.value = currentPage;

	prevPageButton.disabled = currentPage <= 1;
	nextPageButton.disabled = currentPage >= totalPages;

	const paginationDiv = document.querySelector('.pagination');
	paginationDiv.style.display = 'flex';
}

function displayStatistics() {
	const {
		totalPatterns,
		longestPattern,
		shortestPattern,
		averagePattern,
		uniqueParseTags,
	} = allData;

	statsContent.innerHTML = '';

	const stats = [
		{ label: 'Total Patterns', value: totalPatterns },
		{ label: 'Longest Pattern Length', value: `${longestPattern} characters` },
		{ label: 'Shortest Pattern Length', value: `${shortestPattern} characters` },
		{ label: 'Average Pattern Length', value: `${averagePattern} characters` },
	];

	if (uniqueParseTags.length > 0)
		stats.push({ label: 'Unique Parse Tags', value: uniqueParseTags.join(', ') });

	stats.forEach((stat) => {
		const statItem = document.createElement('div');
		statItem.className = 'stat-item';
		statItem.innerHTML = `<strong>${stat.label}:</strong><br>${stat.value}`;
		statsContent.appendChild(statItem);
	});
}

function showPage(page) {
	patternsContent.innerHTML = '';
	currentPage = page;
	updatePaginationControls();

	const startIndex = (currentPage - 1) * resultsPerPage;
	let endIndex = startIndex + resultsPerPage;
	if (endIndex > allResults.length)
		endIndex = allResults.length;
	const pageResults = allResults.slice(startIndex, endIndex);

	const ul = document.createElement('ul');
	patternsContent.appendChild(ul);

	pageResults.forEach((result) => {
		const li = document.createElement('li');
		li.className = 'result';

		// replace double spaces with single spaces
		const patternText = result.text.trim().replace(/\s+/g, ' ');

		li.textContent = patternText;

		li.addEventListener('mouseenter', (e) => {
			if (result.tags.length > 0) {
				tooltip.innerHTML = `<strong>Parse Tags:</strong><br>${result.tags.join(', ')}`;
				tooltip.style.display = 'block';
				positionTooltip(e);
			}
		});
		li.addEventListener('mousemove', (e) => { positionTooltip(e); });
		li.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
		li.addEventListener('click', () => { copyToClipboard(patternText); });

		ul.appendChild(li);
	});
}

function changePage(page) {
	if (page < 1)
		page = 1;
	if (page > totalPages)
		page = totalPages;
	currentPage = page;
	showPage(currentPage);
}

function resetPagination() {
	allData = null;
	allResults = [];
	currentPage = 1;
	totalPages = 1;
	patternsContent.innerHTML = '';
	updatePaginationControls();
}

function positionTooltip(e) {
	const tooltipWidth = tooltip.offsetWidth;
	const tooltipHeight = tooltip.offsetHeight;
	const pageWidth = window.innerWidth;
	const pageHeight = window.innerHeight;

	let x = e.clientX + 15;
	let y = e.clientY + 15;

	// account if out of bounds
	if (x + tooltipWidth > pageWidth)
		x = e.clientX - tooltipWidth - 15;
	if (y + tooltipHeight > pageHeight)
		y = e.clientY - tooltipHeight - 15;

	tooltip.style.left = x + 'px';
	tooltip.style.top = y + 'px';
}

function displayError(message) {
	resetPagination();

	patternsContent.innerHTML = `<p class="error">${message}</p>`;
	statsContent.innerHTML = '';

	patternInput.classList.add('input-error');
}

function initializeTheme() {
	const theme = localStorage.getItem('theme') || 'light';
	const body = document.body;
	const themeToggleButton = document.getElementById('theme-toggle');

	if (theme === 'dark') {
		body.classList.add('dark-mode');
		themeToggleButton.textContent = 'Switch to Light Mode';
	} else {
		body.classList.remove('dark-mode');
		themeToggleButton.textContent = 'Switch to Dark Mode';
	}
}

function toggleTheme() {
	const body = document.body;
	const themeToggleButton = document.getElementById('theme-toggle');
	if (body.classList.contains('dark-mode')) {
		body.classList.remove('dark-mode');
		themeToggleButton.textContent = 'Switch to Dark Mode';
		localStorage.setItem('theme', 'light');
	} else {
		body.classList.add('dark-mode');
		themeToggleButton.textContent = 'Switch to Light Mode';
		localStorage.setItem('theme', 'dark');
	}
}

function copyToClipboard(text) {
	navigator.clipboard.writeText(text).then(
		() => { showCopyNotification(); },
		(err) => { console.error('Could not copy text: ', err); }
	);
}

function showCopyNotification() {
	copyNotification.classList.add('show');
	setTimeout(() => {
		copyNotification.classList.remove('show');
	}, 2000);
}
