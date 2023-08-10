
let delta,
	currentPuzzle,
	currentTime,
	puzzleSettings = {
		size: 7,
		difficulty: 0,
		wrapping: false
	};

function setDelta (value) {
	delta = value;
}

function setCurrentPuzzle (puzzle) {
	currentPuzzle = puzzle;
}

function updateTime () {
	currentTime = window.performance.now() / 1000;
}

function updatePuzzleSettings (settings) {
	puzzleSettings = settings;
}
