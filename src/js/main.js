
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

//@-import "./classes/Song.js"
//@-import "./classes/FxAPI.js"

//@-import "./modules/sounds.js"
@import "./modules/entry.js"
@import "./modules/Input.js"
@import "./modules/StarFieldGenerator.js"
@import "./modules/utils.js"
@import "./modules/test.js"


// default preferences
let Pref = {
		music: false,
		sound: true,
		size: 7,
	};


const galaxies = {
	init() {
		// fast references
		this.els = {
			content: window.find("content"),
			info: window.find(".audio-info"),
		};

		// get settings, if any
		this.settings = window.settings.getItem("settings") || { ...Pref };
		this.dispatch({ type: "apply-settings" });
		
		// create camera
		TheCamera = new Camera();

		// music info
		this.tune = { name: "tune-1" };

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
				// save game state
				window.settings.setItem("settings", Self.settings);
				break;
			
			case "window.focus":
				if (!mainFSM.isPaused) fpsControl.start();
				break;
			case "window.blur":
				if (!mainFSM.isPaused) fpsControl.stop();
				break;

			case "apply-settings":
				Self.dispatch({ type: "set-puzzle-size", arg: Self.settings.size, silent: true });
				break;
			case "restart-level":
				selector.resetPuzzle();
				// reset view
				Self.els.content.removeClass("show-start show-pause show-success");
				break;
			case "solve-level":
				selector.solvePuzzle();
				break;
			case "new-puzzle":
				// reset view
				Self.els.content.removeClass("show-start show-pause show-success");
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
				// save choise to settings 
				Self.settings.size = puzzleSettings.size;
				// update menu
				window.bluePrint.selectNodes(`//Menu[@check-group="galaxies-puzzle-size"]`).map(xMenu => {
					if (+xMenu.getAttribute("arg") === Self.settings.size) xMenu.setAttribute("is-checked", 1);
					else xMenu.removeAttribute("is-checked");
				});
				// reset game
				if (!event.silent) Self.dispatch({ type: "new-puzzle" });
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
				Self.els.content.removeClass("show-start show-pause show-success");

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
				Self.els.content[value ? "removeClass" : "addClass"]("show-pause");
				// return state value
				return value;
			case "puzzle-solved":
				// show fireworks
				Self.els.content.addClass("show-success");
				break;
			case "toggle-music":
				if (!Self.tune.song) {
					let opt = {
							onend: e => {
								if (!Self.tune.song) return;

								let [a, b] = Self.tune.name.split("-");
								b = (+b) + 1;
								// next tune
								if (b > 1) b = 1;
								Self.tune.name = "tune-"+ b;
								// play next song
								playSong();
							}
						},
						playSong = () => window.audio.play(Self.tune.name, opt)
												.then(song => Self.tune.song = song);
					playSong();

					return true;
				} else if (Self.tune.song) {
					Self.tune.song.stop();
					delete Self.tune.song;
				}
				break;
			case "audio-progress":
				Self.els.info.css({ "--progress": event.value });
				switch (event.value) {
					// show progress bar
					case 0: Self.els.info.addClass("show"); break;
					// hide progress bar
					case 100: Self.els.info.removeClass("show"); break;
				}
				break;
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
		}
	}
};

window.exports = galaxies;
