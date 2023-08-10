
class StarsLayer {
	constructor (z) {
		this.z = z;
	}

	render () {
		let m = new Matrix4([
			50, 0, 0, 0,
			0, 50, 0, 0,
			0, 0, 1, 0,
			Math.round(TheCamera.x), Math.round(TheCamera.y), this.z, 1
		]);
		
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		StarsShader.use({
			[U_TEXTURE_STARS]: { slot: 0, texture: StarFieldTexture },
			[U_MODELMATRIX]: m
		});
		
		StarfieldShader.use({
			[U_TIME]: currentTime,
			[U_MODELMATRIX]: m
		});

		Quad.draw();
	}
}
