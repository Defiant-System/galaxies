import { Geometry } from '../Geometry.js'

export const SelectorCube = new Geometry({
	vertices: [
		// Top
		-1, -1, +1,
		+1, -1, +1,
		+1, +1, +1,
		-1, +1, +1,

		// Left
		-1, +1, 0,
		-1, -1, 0,
		-1, -1, +1,
		-1, +1, +1,

		// Right
		+1, -1, 0,
		+1, +1, 0,
		+1, +1, +1,
		+1, -1, +1,

		// Front
		-1, -1, 0,
		+1, -1, 0,
		+1, -1, +1,
		-1, -1, +1
	],
	indices: [
		0, 1, 2,
		0, 2, 3,

		4, 5, 6,
		4, 6, 7,

		8, 9, 10,
		8, 10, 11,

		12, 13, 14,
		12, 14, 15
	]
})