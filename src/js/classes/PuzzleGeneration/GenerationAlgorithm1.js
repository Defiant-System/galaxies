
let SPACE_TYPE = 0;
let EDGE_H_TYPE = 1;
let EDGE_V_TYPE = 2;
let CORNER_TYPE = 3;

class GenerationAlgorithm1 extends GenerationAlgorithmBase {
	constructor (size, wrapping) {
		super(size, wrapping);
	}

	generate () {
		let startIt = this.wrapping ? 0 : 0.5;
		let endIt = this.size - 0.5;
		let todo = [];

		for (let y = startIt; y <= endIt; y += 0.5) {
			for (let x = startIt; x <= endIt; x += 0.5) {
				let type = CORNER_TYPE;
				if (x % 1 === 0.5 && y % 1 === 0.5) type = SPACE_TYPE;
				else if (x % 1 === 0.5) type = EDGE_H_TYPE;
				else if (y % 1 === 0.5) type = EDGE_V_TYPE;
				todo.push({ x, y, type });
			}
		}

		shuffle(todo);

		for (let i = 0; i < todo.length; i++) {
			let thing = todo[i]
			if (thing.type !== CORNER_TYPE) {
				let expanded = this.tryExpand(thing);
				if (expanded) {
					continue;
				}
			}

			if ((thing.type === EDGE_H_TYPE || thing.type === EDGE_V_TYPE) && i % 2) {
				continue;
			}

			this.addGalaxyAt(thing);
		}

		this.mergeSingletons();
	}

	tryExpand (thing) {
		let spaces = this.getTouchingSpaces(thing);
		if (spaces.some(space => space.id !== -1)) return false;

		let neighboringSpaces = this.getNeighboursForMultiple(spaces);
		shuffle(neighboringSpaces);

		for (let neighbour of neighboringSpaces) {
			let galaxyId = neighbour.id;
			if (galaxyId === -1) continue;
			let galaxySize = this.galaxies[galaxyId].spaces.size;
			if (galaxySize < this.maxGalaxySize && this.tryExpandOrMoveGalaxy(galaxyId, spaces)) {
				return true;
			}
		}

		return false;
	}

	tryExpandOrMoveGalaxy (id, spaces) {
		let center = this.galaxies[id].center;
		let currentGalaxySize = this.galaxies[id].spaces.size;
		let opposites = spaces.map(space => this.getOppositeSpaceFrom(space, center));
		let oppositesAreValid = opposites.every(opposite => opposite && (opposite.id === -1 || opposite.id === id));

		if (oppositesAreValid) {
			for (let space of spaces) {
				this.setSymmetricallyAt(space, id);
			}
			return true;
		}

		// Expanding failed, try moving center
		let newCenter = new Vector2(
			center.x * currentGalaxySize,
			center.y * currentGalaxySize
		);

		spaces.forEach(space => {
			newCenter.x += this.wrapping ? closestModulo(center.x, space.x + 0.5, this.size) : space.x + 0.5;
			newCenter.y += this.wrapping ? closestModulo(center.y, space.y + 0.5, this.size) : space.y + 0.5;
		});

		newCenter.x /= currentGalaxySize + spaces.length;
		newCenter.y /= currentGalaxySize + spaces.length;
		newCenter.x = (newCenter.x + this.size) % this.size;
		newCenter.y = (newCenter.y + this.size) % this.size;

		if (newCenter.x % 0.5 !== 0 || newCenter.y % 0.5 !== 0) {
			// new center to encompass new spaces does not lie on a valid position
			return false;
		}

		// Check if the existing spaces of the galaxy still have valid opposites with the new center
		// and the new ones as well
		let newSpaces = [...this.galaxies[id].spaces, ...spaces];
		for (let space of newSpaces) {
			let opposite = this.getOppositeSpaceFrom(space, newCenter);
			if (!opposite || (opposite.id !== -1 && opposite.id !== id)) {
				return false;
			}
		}

		this.galaxies[id].center = newCenter;

		for (let space of newSpaces) {
			this.setSymmetricallyAt(space, id);
		}

		return true;
	}
}
