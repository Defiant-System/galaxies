
@import "../audio/Context.js"


class FxAPI extends AudioWorkletNode {
	constructor(context, processor) {
		super(context, processor);
		this.port.onmessage = this.handleMessage.bind(this);
		console.log("[Node:constructor] created.");
	}

	sendMessage(name) {
		let contextTimestamp = this.context.currentTime;
		this.port.postMessage({ name, contextTimestamp });
	}

	handleMessage(event) {
		let soundBuffer = this.createAudioBuffer(event.data.buffer);
		let source = TheAudioContext.createBufferSource();
		let sampleNoise = Math.random() * 2 - 1;
		source.buffer = soundBuffer;
		source.playbackRate.value = Math.pow(2, sampleNoise * 0.1);
		source.connect(TheAudioDestination);
		source.start();
	}

	createAudioBuffer(array) {
		if (!Array.isArray(array)) array = [array];
		let result = TheAudioContext.createBuffer(array.length, array[0].length, contextSampleRate);
		for (let i = 0; i < array.length; i++) {
			result.getChannelData(i).set(array[i]);
		}
		return result;
	}
}


let Sounds = {
	async init() {
		await TheAudioContext.audioWorklet.addModule("~/js/worklets/sound-fx-worklet.js");
		this.fxAPI = new FxAPI(TheAudioContext, "sound-fx-worklet");
	},
	play(name) {
		this.fxAPI.sendMessage(name);
	},
	toggle(value) {
		
	},
	destroy() {
		
	}
};
// auto init
Sounds.init();
