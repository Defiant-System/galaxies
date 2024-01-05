
let FOVY = 0.5;
let TheCamera;
let TheCanvas = window.find(".canvas");
let gl = TheCanvas[0].getContext("webgl");
gl.enable(gl.CULL_FACE);
gl.enable(gl.BLEND);
gl.enableVertexAttribArray(0);


@import "./classes/Math/Vector4.js"
@import "./classes/Math/Vector2.js"
@import "./classes/Math/Vector3.js"
@import "./classes/Math/Matrix3.js"
@import "./classes/Math/Matrix4.js"

@import "./classes/Board.js"
@import "./classes/Camera.js"
@import "./classes/FSM.js"
@import "./classes/Geometry.js"
@import "./classes/Grid.js"
@import "./classes/Puzzle.js"
@import "./classes/Texture.js"
@import "./classes/PuzzleGenerator.js"
@import "./classes/PuzzleRenderer.js"
@import "./classes/RenderTarget.js"
@import "./classes/ShaderProgram.js"
@import "./classes/Selector.js"
@import "./classes/StarsLayer.js"

@import "./classes/PuzzleGeneration/PuzzleSolver.js"
@import "./classes/PuzzleGeneration/GenerationAlgorithmBase.js"
@import "./classes/PuzzleGeneration/GenerationAlgorithm1.js"
@import "./classes/PuzzleGeneration/GenerationAlgorithm2.js"
@import "./modules/Geometries/SelectorCube.js"
@import "./modules/Geometries/Quad.js"
@import "./modules/Graphics/sharedLiterals.js"
@import "./modules/Graphics/ShaderCommons.js"

@import "./modules/Shaders/TileShader.js"
@import "./modules/Shaders/StarsShader.js"
@import "./modules/Shaders/PuzzleShader.js"
@import "./modules/Shaders/SelectorShader.js"
@import "./modules/Shaders/GridShader.js"
@import "./modules/Shaders/StarfieldShader.js"

@import "./classes/Song.js"
@import "./classes/FxAPI.js"

@import "./modules/sounds.js"
@import "./modules/entry.js"
@import "./modules/Input.js"
@import "./modules/StarFieldGenerator.js"
@import "./modules/utils.js"
@import "./modules/test.js"


const galaxies = {
	init() {
		// fast references
		this.content = window.find("content");

		// create camera
		TheCamera = new Camera();

		// DEV-ONLY-START
		Test.init(this);
		// DEV-ONLY-END
	},
	dispatch(event) {
		let Self = galaxies,
			value;
		// console.log(event);
		switch (event.type) {
			case "window.init":
				break;
			case "window.close":
				Sounds.destroy();
				break;
			// case "window.blur":
			// case "window.focus":
			// 	break;
			case "restart-level":
				selector.resetPuzzle();
				// reset view
				Self.content.removeClass("show-start show-pause show-success");
				break;
			case "toggle-music":
				Sounds.toggle(Sounds._playing ? 0 : 1);
				break;
			case "solve-level":
				selector.solvePuzzle();
				break;
			case "new-puzzle":
				// reset view
				Self.content.removeClass("show-start show-pause show-success");
				// reset game
				mainFSM.setState(PUZZLE_FADE_OUT);
				break;
			case "set-puzzle-difficulty":
				puzzleSettings.difficulty = +event.difficulty;
				// reset game
				Self.dispatch({ type: "new-puzzle" });
				break;
			case "set-puzzle-size":
				puzzleSettings.size = +event.arg;
				// reset game
				Self.dispatch({ type: "new-puzzle" });
				return true;
			case "toggle-endless-game":
				value = puzzleSettings.wrapping;
				puzzleSettings.wrapping = !value;
				// reset game
				Self.dispatch({ type: "new-puzzle" });
				return value;
			case "start-game":
				window.find(`.toolbar-tool_[data-arg="${puzzleSettings.size}"]`).trigger("click");
				break;
			case "new-game":
				// reset view
				Self.content.removeClass("show-start show-pause show-success");

				let puzzle = new PuzzleGenerator(puzzleSettings).generate();
				currentPuzzle = puzzle;
				TheCamera.reset();

				mainFSM.setState(PUZZLE_STATE);
				break;
			case "pause-game":
				value = !mainFSM.isPaused;
				mainFSM.isPaused = value;
				if (!value) tick();
				// show/hide pause view
				Self.content[value ? "removeClass" : "addClass"]("show-pause");
				// return state value
				return value;
			case "puzzle-solved":
				// show fireworks
				Self.content.addClass("show-success");
				break;
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
		}
	}
};

window.exports = galaxies;
