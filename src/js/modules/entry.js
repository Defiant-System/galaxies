
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


let mainFSM = new FSM({
	[INTRO]: {
		enter () {
			// let puzzle = new PuzzleGenerator(puzzleSettings).generate();
			let puzzle = new Puzzle(5, [], false);
			currentPuzzle = puzzle;

			TheCanvas[0].width = window.innerWidth;
			TheCanvas[0].height = window.innerHeight;
			TheCamera.updateMaxZoom();

			renderer = new PuzzleRenderer();
			TheCamera.reset();
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
		},

		leave () {
			
		}
	},

	[PUZZLE_FADE_OUT]: {
		enter () {
			transitionTime = 0;
			selector = null;
			renderer.handleCancel();
		},

		execute () {
			transitionTime += delta;
			if (transitionTime >= 0.5) {
				mainFSM.setState(PUZZLE_FADE_IN);
			}
		}
	}
}, INTRO);


mainFSM.isPaused = true


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

function step() {
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

function render() {
	gl.viewport(0, 0, TheCanvas[0].width, TheCanvas[0].height);
	gl.clearColor(0.02, 0, 0.05, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	bg.render();
	if (selector) selector.render();
	
	renderer.render();
	if (selector) selector.renderPass2();
	
	// fg.render();
}

// create FPS control
let fpsControl =  karaqu.FpsControl({
	fps: 60,
	callback(time) {
		delta = clamp((time - lastTime) / 1000, 0.001, 0.5);
		currentTime = window.performance.now() / 1000;
		lastTime = time;

		if (!isNaN(delta)) {
			step();
			render();
		}
	}
});

// function tick(time) {
// 	if (mainFSM.isPaused) return;
// 	delta = clamp((time - lastTime) / 1000, 0.001, 0.5);
// 	currentTime = window.performance.now() / 1000;
// 	lastTime = time;
// 	if (!isNaN(delta)) {
// 		step();
// 		render();
// 		// updateDifficultyButton(puzzleSettings);
// 	}
// 	requestAnimationFrame(tick);
// }

let StarFieldTexture;
generateStarField().then(texture => {
	StarFieldTexture = texture;
	mainFSM.isPaused = false;
	fpsControl.start();
	// tick();
});
