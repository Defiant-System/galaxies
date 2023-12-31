
let INVALID_POS = -2;

class Puzzle extends Board {
	constructor (size, galaxies, wrapping) {
		super(size, wrapping);

		this.solution = galaxies.map(galaxy => {
			return {
				center: galaxy.center,
				spaces: [...galaxy.spaces]
			};
		});

		this.centers = galaxies.map(galaxy => galaxy.center);

		this.gridOffset = {
			x: this.size / 2 - 0.5,
			y: this.size / 2 - 0.5
		};

		this.colorIds = shuffle([0, 1, 2, 3, 4, 5]);

		this.reset()
	}

	reset () {
		this.init();

		for (let center of this.centers) {
			this.addGalaxyAt(center);
		}

		this.centerSpaces = [];
		this.galaxies.forEach(galaxy => this.centerSpaces.push(...galaxy.centerSpaces));
		this.locks = new Map();
		for (let space of this.grid) {
			this.locks.set(space, false);
		}

		this.updateConnections();
	}

	solve () {
		this.solution.forEach((galaxy, index) => {
			for (let space of galaxy.spaces) {
				this.setAt(space, index);
			}
		});

		this.updateConnections();
	}

	isSolved () {
		for (let space of this.grid) {
			if (space.id === -1) {
				return false;
			}
		}

		return this.disconnectedSpaces.size === 0;
	}

	isLockedAt (pos) {
		return this.locks.get(this.getSpaceAt(pos));
	}

	toggleLockedAt (pos) {
		let space = this.getSpaceAt(pos);
		if (!space || space.id === -1 || this.isGalaxyCenter(pos)) {
			return false;
		}
		let oppositeSpace = this.getOppositeSpaceFromId(pos, space.id);
		let newLock = !this.isLockedAt(pos);
		this.locks.set(space, newLock);
		this.locks.set(oppositeSpace, newLock);
		return true;
	}

	setSymmetricallyAt (pos, id) {
		let space = this.getSpaceAt(pos);

		if (space.id === id) {
			return false;
		}

		// Get the spaces and their IDs that are about to be changed
		let oppositeSpace = this.getOppositeSpaceFromId(pos, id);
		if (this.isLockedAt(space) || !oppositeSpace || this.isLockedAt(oppositeSpace)) {
			return false;
		}
		let result = super.setSymmetricallyAt(pos, id, true);
		this.updateConnections();
		return result;
	}

	unsetSymmetricallyAt (pos) {
		let space = this.getSpaceAt(pos);
		if (space.id === -1 || !this.canUnsetAt(pos) || this.isLockedAt(space)) {
			return false;
		}
		super.unsetSymmetricallyAt(pos);
		this.updateConnections();
		return true;
	}

	getIdAt (pos) {
		let space = this.getSpaceAt(pos);
		return space ? space.id : INVALID_POS;
	}

	canUnsetAt (pos) {
		if (this.isGalaxyCenter(pos)) {
			return false;
		}
		return this.getSpaceAt(pos) !== null;
	}

	isConnectedAt(id, pos) {
		return this.getIdAt(pos) === id;
	}

	updateConnections () {
		let connected = new Set();
		let toVisit = [...this.centerSpaces];

		while (toVisit.length > 0) {
			let space = toVisit.pop();
			connected.add(space);
			this.getNeighbouringSpaces(space).forEach(neighbour => {
				if (neighbour.id === space.id && !connected.has(neighbour)) toVisit.push(neighbour);
			});
		}

		this.disconnectedSpaces = new Set();
		this.connectedSpaceCount = 0;
		this.connectionData = [];

		this.grid.forEach((space) => {
			let { x, y, id } = space;
			if (!connected.has(space)) {
				this.disconnectedSpaces.add(`${space.x}_${space.y}`);
			}
			else if (id > -1) {
				this.connectedSpaceCount++;
			}
			let spaceLeft = this.isConnectedAt(id, { x: x - 1, y });
			let spaceRight = this.isConnectedAt(id, { x: x + 1, y });
			let spaceDown = this.isConnectedAt(id, { x, y: y - 1 });
			let spaceUp = this.isConnectedAt(id, { x, y: y + 1 });
			let spaceUpLeft = spaceLeft && spaceUp && this.isConnectedAt(id, { x: x - 1, y: y + 1 });
			let spaceUpRight = spaceRight && spaceUp && this.isConnectedAt(id, { x: x + 1, y: y + 1 });
			let spaceDownLeft = spaceLeft && spaceDown && this.isConnectedAt(id, { x: x - 1, y: y - 1 });
			let spaceDownRight = spaceRight && spaceDown && this.isConnectedAt(id, { x: x + 1, y: y - 1 });

			let h = spaceLeft && spaceRight ? 2 : spaceLeft ? -1 : spaceRight ? 1 : 0;
			let v = spaceUp && spaceDown ? 2 : spaceDown ? -1 : spaceUp ? 1 : 0;

			this.connectionData.push(
				new Vector4(
					h,
					v,
					spaceUpRight && spaceDownLeft ? 2 : spaceUpRight ? 1 : spaceDownLeft ? -1 : 0,
					spaceUpLeft && spaceDownRight ? 2 : spaceUpLeft ? 1 : spaceDownRight ? -1 : 0
				)
			);
		});
	}

	getShaderConnectionData ({ x, y }) {
		return this.connectionData[x + y * this.size];
	}

	isSpaceConnectedToCenter ({ x, y }) {
		return !this.disconnectedSpaces.has(`${x}_${y}`);
	}
}
