
@import "./classes/Board.js"
@import "./classes/Camera.js"
@import "./classes/FSM.js"
@import "./classes/Geometry.js"
@import "./classes/Grid.js"
@import "./classes/Puzzle.js"
@import "./classes/PuzzleGenerator.js"
@import "./classes/PuzzleRenderer.js"
@import "./classes/Selector.js"
@import "./classes/StarsLayer.js"

@import "./modules/Assets.js"
@import "./modules/Audio.js"
@import "./modules/debug.js"
@import "./modules/entry.js"
@import "./modules/globals.js"
@import "./modules/Input.js"
@import "./modules/StarFieldGenerator.js"
@import "./modules/UI.js"
@import "./modules/utils.js"

@import "./modules/test.js"



const TheCanvas = document.querySelector('canvas')
const gl = TheCanvas.getContext('webgl')
gl.enable(gl.CULL_FACE)
gl.enable(gl.BLEND)
gl.enableVertexAttribArray(0)


const FOVY = 0.5
const TheCamera = new Camera()



const galaxies = {
	init() {
		// fast references
		this.content = window.find("content");

		// DEV-ONLY-START
		Test.init(this);
		// DEV-ONLY-END
	},
	dispatch(event) {
		switch (event.type) {
			case "window.init":
				break;
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
		}
	}
};

window.exports = galaxies;
