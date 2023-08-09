
let delta
function setDelta (value) {
	delta = value
}

let currentPuzzle
function setCurrentPuzzle (puzzle) {
	currentPuzzle = puzzle
}

let currentTime
function updateTime () {
	currentTime = performance.now() / 1000
}

let puzzleSettings = {
	size: 7,
	difficulty: 0,
	wrapping: false
}

function updatePuzzleSettings (settings) {
	puzzleSettings = settings
}