
class Camera {
	constructor () {
		this.matrix = new Matrix4();
		this.projectionMatrix = new Matrix4();
		this.projectionMatrixInverse = new Matrix4();
		this.viewMatrix = new Matrix4();
		this.x = 0;
		this.y = 0;
		this.velX = 0;
		this.velY = 0;
		this.zoom = 1000;

		// document.addEventListener('wheel', this.onWheel.bind(this));
	}

	reset () {
		this.x = currentPuzzle.size - 1;
		this.y = currentPuzzle.size - 1;

		this.updateMaxZoom();
		this.zoom = this.initZoom;
	}

	updateMaxZoom () {
		let fovX = 2 * Math.atan(TheCanvas[0].width / TheCanvas[0].height * Math.tan(FOVY / 2));
		let zX = currentPuzzle.size / Math.tan(fovX);
		let zY = currentPuzzle.size / Math.tan(FOVY);

		this.initZoom = 3 * Math.max(zX, zY);
		this.maxZoom = (currentPuzzle.wrapping ? 1.6 : 1) * this.initZoom;
	}

	get lookAt () {
		return new Vector3(this.x, this.y, 0);
	}

	get lookFrom () {
		return new Vector3(this.x, this.y - 0.1 * this.zoom, this.zoom);
	}

	updateMatrix () {
		this.zoom = clamp(this.zoom, 16, this.maxZoom);

		let up = new Vector3(0, 1, 0);
		this.matrix.setTranslation(this.lookFrom);
		this.matrix.lookAt(this.lookFrom, this.lookAt, up);
	}

	onWheel (e) {
		if (currentPuzzle.wrapping) {
			this.zoom *= Math.pow(2, Math.sign(e.deltaY) * 0.04);
		}
	}

	step () {
		if (Input.usingMouse && currentPuzzle.wrapping) {
			let margin = Math.min(TheCanvas[0].width, TheCanvas[0].height) * 0.1;
			let acc = this.zoom * delta;

			if (Input.mouseX < margin) this.velX -= acc;
			if (Input.mouseY < margin) this.velY += acc;
			if (Input.mouseX > TheCanvas[0].width - margin) this.velX += acc;
			if (Input.mouseY > TheCanvas[0].height - margin) this.velY -= acc;

			this.velX -= 4 * this.velX * delta;
			this.velY -= 4 * this.velY * delta;

			this.x += this.velX * delta;
			this.y += this.velY * delta;
		}

		if (!currentPuzzle.wrapping) {
			this.x = clamp(this.x, 0, (currentPuzzle.size - 1) * 2);
			this.y = clamp(this.y, 0, (currentPuzzle.size - 1) * 2);
		}

		this.updateMatrix();
		this.viewMatrix.getInverse(this.matrix);
		this.projectionMatrix.fromPerspective(FOVY, TheCanvas[0].width / TheCanvas[0].height, 1, 1000);
		this.projectionMatrixInverse.getInverse(this.projectionMatrix);
	}

	handlePanStart (e) {
		this.panning = true;
		this.targetX = this.x;
		this.targetY = this.y;
		this.panStartState = {
			x: this.x,
			y: this.y,
			zoom: this.zoom,
			touchStartGridPositions: {}
		};
		for (let id in e) {
			this.panStartState.touchStartGridPositions[id] = this.getRayGridIntersection(e[id].pageX, e[id].pageY);
		}
	}

	handlePanUpdate (e) {
		this.x = this.panStartState.x;
		this.y = this.panStartState.y;
		this.zoom = this.panStartState.zoom;

		this.updateMatrix();

		let ids = Object.keys(e);
		let touchGridPositions = {};
		for (let id in e) {
			touchGridPositions[id] = this.getRayGridIntersection(e[id].pageX, e[id].pageY);
		}

		let start1 = this.panStartState.touchStartGridPositions[ids[0]];
		let start2 = this.panStartState.touchStartGridPositions[ids[1]];
		let target1 = touchGridPositions[ids[0]];
		let target2 = touchGridPositions[ids[1]];

		let originalCenter = start1.clone().add(start2).multiplyScalar(0.5);
		let originalDistance = start1.distanceTo(start2);
		let newCenter = target1.clone().add(target2).multiplyScalar(0.5);
		let newDistance = target1.distanceTo(target2);

		let zoomFactor = originalDistance / newDistance;

		this.x = this.panStartState.x - (newCenter.x - originalCenter.x) * zoomFactor;
		this.y = this.panStartState.y - (newCenter.y - originalCenter.y) * zoomFactor;
		this.zoom = this.panStartState.zoom * zoomFactor;
	}

	handlePanEnd (e) {
		this.panning = false;
	}

	getRayGridIntersection (x, y) {
		x = 2 * x / TheCanvas[0].width - 1;
		y = 1 - 2 * y / TheCanvas[0].height;

		let origin = this.matrix.getTranslation(new Vector3());

		let direction = new Vector3(x, y, 0.5);
		direction.unproject(this);
		direction.subtract(origin);
		direction.normalize();

		return origin.addScaled(direction, -origin.z / direction.z);
	}
}
