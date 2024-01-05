
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
		this.port.postMessage({ name, buffer });
	}

	process(inputs, outputs) {
		// not using this for now
		return;
	}
}

registerProcessor("sound-fx-worklet", SoundFxWorklet);
