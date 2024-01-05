

import SoundBank from "./sound-bank.js";



class SoundFxWorklet extends AudioWorkletProcessor {
	constructor() {
		super();
		
		SoundBank.init();

		this.port.onmessage = this.handleMessage.bind(this);
	}

	handleMessage(event) {
		this.sendMessage(event.data);
	}

	sendMessage(message) {
		let name = message.name;
		let buffer = SoundBank[name];
		this.port.postMessage({ name, buffer, contextTimestamp: currentTime });
	}

	process(inputs, outputs) {
		let input = inputs[0];
		let output = outputs[0];
		// for (let channel = 0; channel < output.length; ++channel) {
		// 	output[channel].set(input[channel]);
		// }
		return;
	}
}

registerProcessor("sound-fx-worklet", SoundFxWorklet);
