
/**
 * A simple error sound node demo.
 *
 * @class ErrorSound
 * @extends AudioWorkletProcessor
 */

import banan from "./common.js";


class ErrorSound extends AudioWorkletProcessor {

	p = 0

	volumeEnvelope = [
		[0, 0],
		[0.001, 0.5, 0.5],
		[0.5, 0],
		[0.501, 0.5, 0.5],
		[1, 0]
	]

	getSample (t) {
		// this.p += Soundgeneration.getFrequencyDelta(44);
		// return Soundgeneration.sampleSawtooth(this.p);
	}

	process(inputs, outputs) {
		// By default, the node has single input and output.
		let input = inputs[0];
		let output = outputs[0];

		console.log( banan );

		for (let channel = 0; channel < output.length; ++channel) {
			output[channel].set(input[channel]);
		}

		return true;
	}
}

registerProcessor("error-sound", ErrorSound);
