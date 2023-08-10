
class Cursor {
	constructor ({ x, y }) {
		this.x = x;
		this.y = y;
		this.worldMatrix = new Matrix4([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			this.x * 2, this.y * 2, 0, 1
		]);
	}

	render () {
		SelectorShader.use({
			[U_TIME]: currentTime,
			[U_MODELMATRIX]: this.worldMatrix
		});
		SelectorCube.draw();
	}
}

class Brush {
	constructor (start, callback) {
		this.start = start;
		this.callback = callback;
	}

	handlePos (pos) {
		for (let pos2 of this.getPathFromTo(pos)) {
			if (!this.callback(pos2)) {
				break;
			}
			this.start = pos2;
		}
	}

	*getPathFromTo (pos) {
		let dx = pos.x - this.start.x;
		let dy = pos.y - this.start.y;
		let { x, y } = this.start;
		while (x !== pos.x || y !== pos.y) {
			let diffX = Math.abs(x - pos.x);
			let diffY = Math.abs(y - pos.y);
			if (diffX > diffY) {
				x += Math.sign(dx);
				yield { x, y };
			} else if (diffX < diffY) {
				y += Math.sign(dy);
				yield { x, y };
			} else {
				let fromId = currentPuzzle.getIdAt({ x, y });
				let toXId = currentPuzzle.getIdAt({ x: x + Math.sign(dx), y });
				if (toXId === fromId) {
					x += Math.sign(dx);
				} else {
					y += Math.sign(dy);
				}
				yield { x, y };
			}
		}
	}
}

let DEFAULT_STATE = 1;
let DRAG_OR_DRAW_STATE = 2;
let MOVING_CAMERA_STATE = 3;
let ERASING_STATE = 4;
let DRAWING_STATE = 5;
let AFTER_MOVING_CAMERA_STATE = 6;

class Selector {
	constructor () {
		this.clearCursors();
		this.selectedId = -1;

		let lastCursorPos;

		// Save bytes by simply not initializing booleans
		// this.hasBeenSolved = false
		this.undoStack = [];
		// this.createdErrorCursor = false
		this.startTimestamp = 0;

		let fsm = this.fsm = new FSM({
			[DEFAULT_STATE]: {
				enter: () => {
					this.clearCursors();
				},

				execute: () => {
					if (Input.pointerDown) {
						fsm.setState(DRAG_OR_DRAW_STATE);
					} else {
						// Hover visual
						this.clearCursors();
						let pos = this.getSpacePosAtPointer();
						let id = this.getIdAtPointer();
						this.addCursorAt(pos, id);
						if (id > -1) {
							this.createCursorsAtOppositeOf(pos, id);
						}
					}
				},

				leave: () => {
					this.clearCursors();
				}
			},

			[DRAG_OR_DRAW_STATE]: {
				enter: () => {
					this.startTimestamp = currentTime;
					this.stateBeforeDraw = this.getState();

					lastCursorPos = this.getSpacePosAtPointer();
					this.selectedId = this.getIdAtPointer();
					this.addCursorAt(lastCursorPos);
					if (this.selectedId > -1) {
						this.createCursorsAtOppositeOf(lastCursorPos, this.selectedId);
					}
				},

				execute: () => {
					if (!Input.pointerDown) {
						let spaceAtPointer = currentPuzzle.getSpaceAt(lastCursorPos);
						if (currentTime >= this.startTimestamp + 0.2 || currentPuzzle.isLockedAt(spaceAtPointer)) {
							if (currentPuzzle.toggleLockedAt(lastCursorPos)) {
								playSample(LockSound);
							}
						} else {
							this.eraseAt(lastCursorPos);
						}
						fsm.setState(DEFAULT_STATE);
					} else {
						let pos = this.getSpacePosAtPointer();

						// Check the ID when moving over a second space to determine the action
						if (pos.x !== lastCursorPos.x || pos.y !== lastCursorPos.y) {
							if (this.selectedId === -1) {
								fsm.setState(ERASING_STATE);
							} else {
								let secondId = currentPuzzle.getIdAt(pos);
								if (secondId !== this.selectedId || currentPuzzle.isGalaxyCenter(pos)) {
									fsm.setState(DRAWING_STATE);
								} else {
									fsm.setState(ERASING_STATE);
								}
							}
						}
					}
				},

				leave: () => {
					this.handleDrawFinish();
					this.clearCursors();
				}
			},

			[ERASING_STATE]: {
				enter: () => {
					this.eraseAt(lastCursorPos);

					this.brush = new Brush(lastCursorPos, (pos) => {
						if (this.selectedId === -1 || currentPuzzle.getIdAt(pos) === this.selectedId) {
							this.eraseAt(pos);
							return true;
						} else {
							return false;
						}
					})

					this.brush.handlePos(this.getSpacePosAtPointer());
				},

				execute: () => {
					if (!Input.pointerDown) {
						fsm.setState(DEFAULT_STATE);
						return;
					}

					this.brush.handlePos(this.getSpacePosAtPointer());
				},

				leave: () => {
					this.handleDrawFinish();
				}
			},

			[DRAWING_STATE]: {
				enter: () => {
					this.brush = new Brush(lastCursorPos, (pos) => {
						this.drawAt(pos);
						return currentPuzzle.getIdAt(pos) === this.selectedId;
					})

					this.brush.handlePos(this.getSpacePosAtPointer());
				},

				execute: () => {
					if (!Input.pointerDown) {
						fsm.setState(DEFAULT_STATE);
						return;
					}

					this.brush.handlePos(this.getSpacePosAtPointer());
				},

				leave: () => {
					this.handleDrawFinish();
				}
			},

			[MOVING_CAMERA_STATE]: {
				enter: () => {
					this.clearCursors();

					Input.onPanUpdate = (e) => {
						TheCamera.handlePanUpdate(e);
					};

					Input.onPanEnd = (e) => {
						fsm.setState(AFTER_MOVING_CAMERA_STATE);
						TheCamera.handlePanEnd(e);
					};
				},

				leave: () => {
					// Input.onPanEnd = noop;
					// Input.onPanUpdate = noop;
				}
			},

			[AFTER_MOVING_CAMERA_STATE]: {
				execute: () => {
					if (Input.pointerDown) {
						fsm.setState(DEFAULT_STATE);
					}
				}
			}
		}, DEFAULT_STATE)

		Input.onPanStart = (e) => {
			if (fsm.activeState !== MOVING_CAMERA_STATE) {
				fsm.setState(MOVING_CAMERA_STATE);
				TheCamera.handlePanStart(e);
			}
		}
	}

	handleStateChange (beforeState, afterState) {
		if (beforeState.toString() !== afterState.toString()) {
			this.undoStack.push(beforeState);
		}
	}

	resetPuzzle () {
		let stateBefore = this.getState();
		currentPuzzle.reset();
		let stateAfter = this.getState();

		this.handleStateChange(stateBefore, stateAfter);
	}

	solvePuzzle () {
		this.hasBeenSolved = true;

		let stateBefore = this.getState();
		currentPuzzle.solve();
		let stateAfter = this.getState();

		this.handleStateChange(stateBefore, stateAfter);
	}

	clearCursors () {
		this.validCursors = {};
		this.invalidCursors = {};
	}

	handleDrawFinish () {
		this.handleStateChange(this.stateBeforeDraw, this.getState());
	}

	getState () {
		return currentPuzzle.grid.map(space => space.id);
	}

	drawAt (pos) {
		let updated = currentPuzzle.setSymmetricallyAt(pos, this.selectedId);
		let addedCursor = this.addCursorAt(pos);
		this.createCursorsAtOppositeOf(pos);

		if (updated) {
			this.soundToPlay = PlaceSound;
		} else if (addedCursor && currentPuzzle.getIdAt(pos) !== this.selectedId) {
			this.soundToPlay = ErrorSound;
		}
	}

	eraseAt (pos) {
		let updated = currentPuzzle.unsetSymmetricallyAt(pos);
		let addedCursor = this.addCursorAt(pos, -1);

		if (updated) {
			this.soundToPlay = PlaceSound;
		} else if (addedCursor && currentPuzzle.getIdAt(pos) !== -1) {
			this.soundToPlay = ErrorSound;
		}
	}

	canUndo () {
		return this.undoStack.length > 0;
	}

	undo () {
		let state = this.undoStack.pop();
		if (!state) {
			return;
		}

		for (let i = 0; i < state.length; i++) {
			currentPuzzle.grid[i].id = state[i];
		}
		currentPuzzle.updateConnections();
	}

	getSpacePosAtPointer () {
		let { x, y } = TheCamera.getRayGridIntersection(Input.mouseX, Input.mouseY);

		x = Math.floor((x + 1) / 2);
		y = Math.floor((y + 1) / 2);

		if (!currentPuzzle.wrapping) {
			x = clamp(x, 0, currentPuzzle.size - 1);
			y = clamp(y, 0, currentPuzzle.size - 1);
		}

		return { x, y };
	}

	addCursorAtPointer (expected = this.selectedId) {
		this.addCursorAt(this.getSpacePosAtPointer(), expected);
	}

	createCursorsAtOppositeOf ({ x, y }, expected = this.selectedId) {
		let center = currentPuzzle.galaxies[expected].center;
		let opposite = currentPuzzle.getOppositePositionFrom({ x, y }, center);

		if (currentPuzzle.wrapping) {
			opposite.x = closestModulo(x, opposite.x, currentPuzzle.size);
			opposite.y = closestModulo(y, opposite.y, currentPuzzle.size);

			for (let ix = -1; ix <= 1; ix++) {
				for (let iy = -1; iy <= 1; iy++) {
					this.addCursorAt(
						{
							x: opposite.x + ix * currentPuzzle.size,
							y: opposite.y + iy * currentPuzzle.size
						},
						expected
					);
				}
			}
		} else {
			this.addCursorAt(
				{
					x: opposite.x,
					y: opposite.y
				},
				expected
			);
		}
	}

	addCursorAt (pos, expected = this.selectedId) {
		let id = currentPuzzle.getIdAt(pos);
		let targetCollection = id === expected ? this.validCursors : this.invalidCursors;
		let key = `${pos.x},${pos.y}`;
		if (targetCollection[key]) {
			return false;
		}

		targetCollection[key] = new Cursor(pos);

		return true;
	}

	getIdAtPointer () {
		let pos = this.getSpacePosAtPointer();
		return currentPuzzle.getIdAt(pos);
	}

	step () {
		this.fsm.updateFSM();

		if (this.soundToPlay) {
			playSample(this.soundToPlay);
			this.soundToPlay = null;
		}

		if (!this.hasBeenSolved && currentPuzzle.isSolved()) {
			this.hasBeenSolved = true;
			// VictorySong.play()
			// MainSong.duckForABit()
			// showCongratulations()

			Input.pointerDown = false;

			galaxies.dispatch({ type: "puzzle-solved" });
		}
	}

	render () {
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		SelectorShader.use({
			[U_TIME]: currentTime,
			[U_VARIANT]: 0
		});
		for (let cursor of Object.values(this.validCursors)) {
			cursor.render();
		}
	}

	renderPass2 () {
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
		SelectorShader.use({
			[U_VARIANT]: 1
		});
		for (let cursor of Object.values(this.invalidCursors)) {
			cursor.render();
		}
		gl.blendEquation(gl.FUNC_ADD);
	}
}
