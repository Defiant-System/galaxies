
let FOVY = 0.5;
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

@import "./modules/Assets.js"
@import "./modules/Audio.js"
@import "./modules/entry.js"
@import "./modules/globals.js"
@import "./modules/Input.js"
@import "./modules/StarFieldGenerator.js"
@import "./modules/utils.js"

@import "./modules/test.js"


let TheCamera = new Camera();



const galaxies = {
	init() {
		// fast references
		this.content = window.find("content");

		// DEV-ONLY-START
		Test.init(this);
		// DEV-ONLY-END
	},
	dispatch(event) {
		let Self = galaxies,
			value;
		switch (event.type) {
			case "window.init":
				break;
			case "new-game":
			case "restart-level":
			case "solve-level":
			case "toggle-music":
				break;
			case "new-game":
				mainFSM.setState(PUZZLE_STATE);
				break;
			case "pause-game":
				value = !mainFSM.isPaused;
				mainFSM.isPaused = value;
				if (!value) tick();
				return value;
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
		}
	}
};

window.exports = galaxies;
