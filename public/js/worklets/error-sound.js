
/**
 * A simple error sound node demo.
 *
 * @class ErrorSound
 * @extends AudioWorkletProcessor
 */

import SoundBank from "./sound-bank.js";


class ErrorSound extends AudioWorkletProcessor {

	constructor() {
		super();

		SoundBank.init();

		this.port.onmessage = this.handleMessage.bind(this);
	}

	handleMessage(event) {
		this.sendMessage(event.data);
	}

	sendMessage(message) {
		let buffer = SoundBank[message.name];
		this.port.postMessage({ buffer, contextTimestamp: currentTime });
	}

	process(inputs, outputs) {
		// By default, the node has single input and output.
		let input = inputs[0];
		let output = outputs[0];

		// for (let channel = 0; channel < output.length; ++channel) {
		// 	output[channel].set(input[channel]);
		// }

		return;
	}
}

registerProcessor("error-sound", ErrorSound);
