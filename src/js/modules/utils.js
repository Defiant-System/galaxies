
// let noop = () => {};

/**
 * Some mathematical utilities
 */
function clamp (x, min, max) {
	return Math.min(Math.max(x, min), max);
}

function approach (x, target, acc) {
	return x > target ? Math.max(x - acc, target) : Math.min(x + acc, target);
}

function ease (t) {
	return t * t * (3 - 2 * t);
}

function overlapping (rect1, rect2) {
	return (
		rect1.x + rect1.width > rect2.x && rect1.x < rect2.x + rect2.width &&
		rect1.y + rect1.height > rect2.y && rect1.y < rect2.y + rect2.height
	);
}

function manhattanDistance (x1, y1, x2, y2) {
	return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function distanceSquared(x1, y1, x2, y2) {
	let dx = Math.abs(x1 - x2);
	let dy = Math.abs(y1 - y2);
	return dx * dx + dy * dy;
}

function closestModulo (target, number, base) {
	let tgt = target - base / 2;
	while (number < tgt) {
		number += base;
	}
	while (number > tgt) {
		number -= base;
	}
	return number;
}

/**
 * Collection utilities
 */

function shuffle (array) {
	for (let i = 0; i < array.length; i++) {
		let j = i + Math.floor(Math.random() * (array.length - i));
		let temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}

function pickRandomFromArray (array) {
	return array[Math.floor(Math.random() * array.length)];
}

function pick (...args) {
	return args[Math.floor(Math.random() * args.length)];
}

function popFromSet (set) {
	for (let el of set) {
		set.delete(el);
		return el;
	}
	return null;
}

function removeFromArray (array, item) {
	let index = array.indexOf(item);
	if (index > -1) {
		array.splice(index, 1);
	}
	return index;
}

/**
 * Image generation utilities
 */

async function generateImage (width, height, callback) {
	let canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	await callback(canvas.getContext("2d"));

	// We could technically return the canvas, but having lots of canvases is slower
	// than having lots of images. Sure the generation time goes up, but at least
	// the gameplay doesn't suffer as much.

	let blob = await new Promise(resolve => canvas.toBlob(resolve));

	return new Promise(resolve => {
		let img = new Image();
		img.onload = () => resolve(img);
		img.src = URL.createObjectURL(blob);
	});
}

/**
 * Color utilities
 */

function makeColorWithAlpha (color, alpha) {
	let [_, type, args] = /^(\w+)\((.*)\)$/.exec(color);
	return `${type}(${args},${alpha})`;
}

/**
 * Animation and audio utils
 */
class EnvelopeSampler {
	constructor (envelope, logarithmic = false) {
		this.envelope = envelope
		this.logarithmic = logarithmic
		this.reset()
	}

	reset () {
		this.i = 0;
	}

	sample (position) {
		while (this.i < this.envelope.length - 1) {
			let [t1, v1, curve = 1] = this.envelope[this.i];
			let [t2, v2] = this.envelope[this.i + 1];
			if (t1 <= position && position < t2) {
				let t = (position - t1) / (t2 - t1);
				if (curve > 1) {
					t = t ** curve;
				} else {
					t = 1 - (1 - t) ** (1 / curve);
				}
				return this.logarithmic ? v1 * (v2 / v1) ** t : v1 + t * (v2 - v1);
			}
			this.i++;
		}
		return this.envelope[this.envelope.length - 1][1];
	}
}

function elastic (t, a = 1, p = 0.5) {
	t /= 1.5;
	return 2 ** (-10 * t) * Math.sin((t - 0.125) * 4 * Math.PI) + 1;
}

function smoothstep(edge0, edge1, x) {
	let t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
	return t * t * (3 - 2 * t);
}

/**
 * Waiting for the next frame is useful for preventing the browser to hang
 * while the assets are being generated
 */
async function waitForNextFrame () {
	// Very hacky, but meh
	updateLoader();
	await new Promise(resolve => requestAnimationFrame(resolve));
}

function zeroPad (str, n) {
	str = str.toString();
	if (str.length > n) {
		return Array(n).fill(9).join("");
	}

	return Array(n - str.length).fill(0).join("") + str;
}
