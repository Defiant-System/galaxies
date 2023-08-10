
/**
 * Global graphics
 */
let bg = new StarsLayer(-2),
	fg = new StarsLayer(5);

// Some shared variables for the different states
let renderer,
	selector,
	transitionTime,
	lastTime = 0;

/**
 * The main state machine
 */
let INTRO = 1,
	PUZZLE_FADE_IN = 2,
	PUZZLE_STATE = 3,
	PUZZLE_FADE_OUT = 4,
	TUTORIAL_FADE = 5,
	TUTORIAL = 6;

async function playMusic () {
	await TheAudioContext.resume();
	if (!MainSong.playing) {
		MainSong.play();
	}
}

let mainFSM = new FSM({
	[INTRO]: {
		enter () {
			let puzzle = new PuzzleGenerator(puzzleSettings).generate();
			currentPuzzle = puzzle;

			TheCanvas[0].width = window.innerWidth;
			TheCanvas[0].height = window.innerHeight;
			TheCamera.updateMaxZoom();

			renderer = new PuzzleRenderer();
			TheCamera.reset();

			// bindStart(() => {
			// 	playMusic();
			// 	mainFSM.setState(PUZZLE_STATE);
			// });

			// bindTutorial(() => {
			// 	if (mainFSM.activeState !== TUTORIAL) {
			// 		playMusic();
			// 		mainFSM.setState(TUTORIAL_FADE);
			// 	}
			// });

			// bindTutorialEnd(() => {
			// 	mainFSM.setState(PUZZLE_FADE_OUT);
			// });

			// bindDifficultySelect((settings) => {
			// 	updatePuzzleSettings(settings);
			// 	mainFSM.setState(PUZZLE_FADE_OUT);
			// });

			// bindNewGame(() => {
			// 	mainFSM.setState(PUZZLE_FADE_OUT);
			// });

			// bindUndo(() => {
			// 	if (selector) {
			// 		selector.undo();
			// 	}
			// });

			// bindSolve(() => {
			// 	if (selector) {
			// 		selector.solvePuzzle();
			// 	}
			// });

			// start();
		}
	},

	[TUTORIAL_FADE]: {
		enter () {
			transitionTime = 0;
			renderer.handleCancel();
		},

		execute () {
			transitionTime += delta;
			if (transitionTime >= 0.5) {
				mainFSM.setState(TUTORIAL);
			}
		}
	},

	[TUTORIAL]: {
		enter () {
			showTutorial();

			let puzzle = new Puzzle(6, [
				{ center: new Vector2(1, 0.5), spaces: [] },
				{ center: new Vector2(2, 1.5), spaces: [] },
				{ center: new Vector2(4, 0.5), spaces: [] },
				{ center: new Vector2(4.5, 2.5), spaces: [] },
				{ center: new Vector2(0.5, 2.5), spaces: [] },
				{ center: new Vector2(2, 3.5), spaces: [] },
				{ center: new Vector2(3.5, 4.5), spaces: [] },
				{ center: new Vector2(2.5, 5.5), spaces: [] },
				{ center: new Vector2(5.5, 3), spaces: [] }
			], false);
			puzzle.setSymmetricallyAt({ x: 0, y: 1 }, 1);
			puzzle.setSymmetricallyAt({ x: 1, y: 2 }, 1);
			currentPuzzle = puzzle;
			renderer = new PuzzleRenderer();
			selector = new Selector();
			TheCamera.reset();
			TheCamera.y = 2;
		}
	},

	[PUZZLE_FADE_IN]: {
		enter () {
			let puzzle = new PuzzleGenerator(puzzleSettings).generate();
			currentPuzzle = puzzle;
			renderer = new PuzzleRenderer();
			// toggleUndo(false);
			TheCamera.reset();
		},

		execute () {
			if (renderer.fadeAmount < 0.2) {
				mainFSM.setState(PUZZLE_STATE);
			}
		}
	},

	[PUZZLE_STATE]: {
		enter () {
			selector = new Selector();
			// showButtons();

			// bindRestart(() => {
			// 	selector.resetPuzzle();
			// })
		},

		leave () {
			// hideButtons();
		}
	},

	[PUZZLE_FADE_OUT]: {
		enter () {
			transitionTime = 0;
			selector = null;
			renderer.handleCancel();
			// hideCongratulations();
		},

		execute () {
			transitionTime += delta;
			if (transitionTime >= 0.5) {
				mainFSM.setState(PUZZLE_FADE_IN);
			}
		}
	}
}, INTRO);


mainFSM.isPaused = false


/**
 * Game loop stuff
 */
let delta,
	currentPuzzle,
	currentTime,
	puzzleSettings = {
		size: 5,
		difficulty: 0,
		wrapping: false
	};

function step () {
	mainFSM.updateFSM();

	TheCamera.step();
	if (selector) { // closure compiler doesn't like the ?. operator here and in render :(
		selector.step();
		if (mainFSM.activeState === PUZZLE_STATE) {
			// toggleUndo(selector.canUndo());
		}
	}
	renderer.step();
}

function render () {
	gl.viewport(0, 0, TheCanvas[0].width, TheCanvas[0].height);
	gl.clearColor(0.02, 0, 0.05, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	bg.render();
	if (selector) selector.render();
	
	renderer.render();
	if (selector) selector.renderPass2();
	
	fg.render();
}

function tick(time) {
	if (mainFSM.isPaused) return;

	delta = clamp((time - lastTime) / 1000, 0.001, 0.5);
	currentTime = window.performance.now() / 1000;
	lastTime = time;

	if (!isNaN(delta)) {
		step();
		render();
		// updateDifficultyButton(puzzleSettings);
	}

	requestAnimationFrame(tick);
}

loadAssets().then(tick);
