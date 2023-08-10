
class Grid {
	render (fadeAmount) {
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		let scale = currentPuzzle.wrapping ? 100 : currentPuzzle.size + 0.1;
		let pos = currentPuzzle.wrapping ? TheCamera : { x: currentPuzzle.size - 1, y: currentPuzzle.size - 1 };

		let m = new Matrix4([
			scale, 0, 0, 0,
			0, scale, 0, 0,
			0, 0, 1, 0,
			pos.x, pos.y, 0, 1
		]);

		GridShader.use({
			[U_TEXTURE_STARS]: { slot: 0, texture: StarFieldTexture },
			[U_MODELMATRIX]: m,
			[U_FADE_AMOUNT]: fadeAmount
		});

		Quad.draw();
	}
}
