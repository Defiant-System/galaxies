
let USE_PRESET = false

class PuzzleGenerator {
	constructor ({ size, wrapping, difficulty }) {
		this.size = size;
		this.wrapping = wrapping;
		this.difficulty = difficulty;
	}

	generate () {
		let pass,
			bestPass,
			maxPasses = USE_PRESET ? 1 : 200,
			i;

		for (i = 0; i < maxPasses; i++) {
			let Algo = USE_PRESET ? DebugAlgorithm : GenerationAlgorithm1;
			pass = new Algo(this.size, this.wrapping);
			pass.generate();
			let diffDiff = this.matchesDifficulty(pass);

			if (diffDiff === 0) {
				bestPass = pass;
				break;
			} else if (!bestPass || diffDiff === -1) {
				bestPass = pass;
			}
		}
		return new Puzzle(this.size, bestPass.galaxies, this.wrapping);
	}

	matchesDifficulty (pass) {
		let { galaxies } = pass,
			solver = new PuzzleSolver(new Puzzle(this.size, galaxies, this.wrapping)),
			result = solver.solve();

		let expandableGalaxyCount = 0;
		for (let galaxy of galaxies) {
			if (galaxy.centerSpaces.size < galaxy.spaces.size) {
				expandableGalaxyCount++;
			}
		}

		if (result) {
			// Solvable without backtracking
			return this.difficulty === 1 ? -1 : 0;
		} else {
			// Not solvable without backtracking (or multiple solutions exist)
			return this.difficulty === 1 ? 0 : 1;
		}
	}
}
