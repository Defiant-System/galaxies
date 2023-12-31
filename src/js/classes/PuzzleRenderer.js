
class PuzzleRenderer {
	constructor () {
		this.mask = new RenderTarget(1024, 1024);
		this.fadeSpeed = 0.5;
		this.fadeT = 0;
		this.grid = new Grid();
	}

	handleCancel () {
		this.fadeSpeed = -2;
	}

	renderMask () {
		this.mask.bind();
		gl.viewport(0, 0, 1024, 1024);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		gl.blendFunc(gl.ONE, gl.ZERO);
		for (let space of currentPuzzle.grid) {
			if (space.id < 0) continue;
			this.renderSpaceMask(space);
		}
		gl.enable(gl.DEPTH_TEST);
		RenderTarget.unbind();
	}

	step () {
		this.fadeT = Math.min(1, this.fadeT + delta * this.fadeSpeed);
		this.fadeAmount = smoothstep(1, 0, this.fadeT);
	}

	render () {
		this.grid.render(this.fadeAmount);

		let { size } = currentPuzzle;
		this.renderMask();
		gl.viewport(0, 0, TheCanvas[0].width, TheCanvas[0].height);
		gl.disable(gl.DEPTH_TEST);
		gl.blendFunc(gl.ONE, gl.ONE);

		PuzzleShader.use({
			[U_TEXTURE]: { slot: 0, texture: this.mask },
			[U_TEXTURE_STARS]: { slot: 1, texture: StarFieldTexture },
			[U_FADE_AMOUNT]: this.fadeAmount,
			[U_TIME]: currentTime
		});

		let modelMatrix = new Matrix4([
			size, 0, 0, 0,
			0, size, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]);

		let currentSpacePos = TheCamera.getRayGridIntersection(TheCanvas[0].width / 2, TheCanvas[0].height / 2);
		currentSpacePos.x = Math.floor((currentSpacePos.x + 1) / (size * 2));
		currentSpacePos.y = Math.floor((currentSpacePos.y + 1) / (size * 2));

		let marginH = currentPuzzle.wrapping ? 3 : 0;
		let marginV = currentPuzzle.wrapping ? 2 : 0;
		let offX = (size - 1) / 2;
		let offY = (size - 1) / 2;

		for (let x = -marginH; x <= marginH; x++) {
			for (let y = -marginV; y <= marginV; y++) {
				PuzzleShader.use({
					[U_MODELMATRIX]: modelMatrix.setTranslation(
						new Vector3(
							((x + currentSpacePos.x) * size + offX) * 2,
							((y + currentSpacePos.y) * size + offY) * 2,
							-0.5
						)
					),
				});
				Quad.draw();
			}
		}

		gl.enable(gl.DEPTH_TEST);
	}

	renderSpaceMask (space) {
		let colorValues = [0.985, 0.067, 0.32, 0.51, 0.667, 0.83],
			colorId = currentPuzzle.colorIds[space.id % currentPuzzle.colorIds.length];
	
		TileShader.use({
			[U_SPACE_POS]: new Vector2(space.x + 0.5, space.y + 0.5),
			[U_WORLD_SIZE]: new Vector2(currentPuzzle.size, currentPuzzle.size),
			[U_COLOR]: colorValues[colorId % 6],
			[U_GALAXY_CENTER]: currentPuzzle.centers[space.id],
			[U_LOCKED]: currentPuzzle.isLockedAt(space) ? 1 : 0,
			[U_SPACE_CONNECTION]: currentPuzzle.getShaderConnectionData(space),
			[U_GALAXY_CONNECTION]: currentPuzzle.isSpaceConnectedToCenter(space),
			[U_TIME]: currentTime
		});
		
		Quad.draw();
	}
}
