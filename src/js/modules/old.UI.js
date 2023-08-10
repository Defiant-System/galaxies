
function getElement (name) {
	return document.querySelector("." + name)
}

function getElements (name) {
	return document.querySelectorAll("." + name)
}

function toggleVisibility (element, show) {
	element.classList.toggle("_hidden", !show)
}

const introModal = getElement("intro")
const startButton = getElement("start")
const tutorialButton = getElement("tutorial")
const tutorialDoneButton = getElement("tutorialDone")
const nextButton = getElement("next")
const tutorialModal = getElement("tutorialModal")
const difficultyModal = getElement("menu")
const difficultyButton = getElement("openMenu")
const difficultyDoneButton = getElement("closeMenu")
const newGameButton = getElement("new")
const restartGameButton = getElement("restart")
const solveGameButton = getElement("solve")
const undoButton = getElement("undo")
const loadingScreen = getElement("loading")
const topButtons = getElement("topButtons")
const congratulations = getElement("congratulations")

/**
 * UI event handlers
 */
let onStart
let onTutorial
let onTutorialEnd
let onDifficultySelect
let onUndo
let onNewGame
let onSolve
let onRestart

function bindStart (callback) {
	onStart = callback
}

function bindTutorial (callback) {
	onTutorial = callback
}

function bindTutorialEnd (callback) {
	onTutorialEnd = callback
}

function bindDifficultySelect (callback) {
	onDifficultySelect = callback
}

function bindUndo (callback) {
	onUndo = callback
}

function bindNewGame (callback) {
	onNewGame = callback
}

function bindSolve (callback) {
	onSolve = callback
}

function bindRestart (callback) {
	onRestart = callback
}

/**
 * UI controlling functions
 */
function updateLoader () {
	loadingScreen.textContent += "."
}
function toggleUndo (show) {
	toggleVisibility(undoButton, show)
}

function showTutorial () {
	toggleVisibility(tutorialModal, true)
}

function showButtons () {
	toggleVisibility(topButtons, true)
	toggleVisibility(difficultyButton, true)
}

function hideButtons () {
	toggleUndo(false)
	toggleVisibility(topButtons, false)
	toggleVisibility(difficultyButton, false)
}

function showCongratulations () {
	toggleVisibility(congratulations, true)

	setTimeout(() => {
		hideCongratulations()
	}, 5000)
}

function hideCongratulations () {
	toggleVisibility(congratulations, false)
}

function updateDifficultyButton () {
	const edgeless = puzzleSettings.wrapping ? " Endless" : ""
	const difficulty = puzzleSettings.difficulty ? "Ridiculous" : "Normal"
	difficultyButton.textContent =
		`${puzzleSettings.size}x${puzzleSettings.size}${edgeless} - ${difficulty}`
}

let dirtySettings

function updateSettingButtons () {
	getElements("button").forEach(button => {
		button.classList.remove("_active")
	})
	difficultyModal.querySelector(`[data-s="${dirtySettings.size}"]`).classList.add("_active")
	difficultyModal.querySelector(`[data-w="${+dirtySettings.wrapping}"]`).classList.add("_active")
	difficultyModal.querySelector(`[data-d="${dirtySettings.difficulty}"]`).classList.add("_active")
}

function start () {
	return;
	
	toggleVisibility(loadingScreen, false)

	startButton.onclick = () => {
		toggleVisibility(introModal, false)
		toggleVisibility(tutorialModal, false)
		onStart()
	}

	tutorialButton.onclick = () => {
		toggleVisibility(introModal, false)
		onTutorial()
	}

	nextButton.onclick = () => {
		const steps = [...getElements("step")]
		let foundVisible = false

		for (let i = 0; i < steps.length; i++) {
			const el = steps[i]
			if (!el.classList.contains("_hidden")) {
				foundVisible = true
				toggleVisibility(el, false)

			} else if (foundVisible) {
				toggleVisibility(el, true)
				if (i === steps.length - 1) {
					toggleVisibility(nextButton, false)
					toggleVisibility(tutorialDoneButton, true)
				}
				break
			}
		}
	}

	tutorialDoneButton.onclick = () => {
		toggleVisibility(introModal, false)
		toggleVisibility(tutorialModal, false)
		onTutorialEnd()
	}

	difficultyButton.onclick = () => {
		dirtySettings = { ...puzzleSettings }
		updateSettingButtons()
		toggleVisibility(difficultyModal, true)
	}

	newGameButton.onclick = () => {
		onNewGame()
	}

	undoButton.onclick = () => {
		onUndo()
	}

	restartGameButton.onclick = () => {
		onRestart()
	}

	solveGameButton.onclick = () => {
		onSolve()
	}

	document.addEventListener("keypress", e => {
		if (e.key === "z") {
			onUndo()
		}
	})

	difficultyModal.onclick = (e) => {
		if (e.target === difficultyModal) {
			toggleVisibility(difficultyModal, false)
		} else if (e.target.dataset["s"]) {
			dirtySettings.size = Number(e.target.dataset["s"])
		} else if (e.target.dataset["w"]) {
			dirtySettings.wrapping = Number(e.target.dataset["w"])
		} else if (e.target.dataset["d"]) {
			dirtySettings.difficulty = Number(e.target.dataset["d"])
		} else if (e.target === difficultyDoneButton) {
			onDifficultySelect(dirtySettings)
			toggleVisibility(difficultyModal, false)
		}

		updateSettingButtons()
	}
}
