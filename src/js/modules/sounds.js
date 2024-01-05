
@import "../audio/song.js"


let TheAudioContext = new window.AudioContext({ sampleRate: 22050 });
let TheAudioDestination = TheAudioContext.createDynamicsCompressor();
let contextSampleRate = TheAudioContext.sampleRate;
let TheReverbDestination;

TheAudioDestination.connect(TheAudioContext.destination);


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
		let name = event.data.name;
		switch (name) {
			case "main-song":
			case "victory-song":
				let options = event.data.buffer;
				options.configs.map(item => { item.buffer = this.createAudioBuffer(item.output) });
				Sounds[name] = new Song(options);
				// start playing main song as soon as it is possible
				if (name === "main-song") Sounds[name].play();
				break;
			case "reverbIR":
				// create reverb
				let reverb = TheAudioContext.createConvolver();
				reverb.buffer = this.createAudioBuffer(event.data.buffer);
				Sounds.setReverbDestination(reverb);
				break;
			default:
				let soundBuffer = this.createAudioBuffer(event.data.buffer);
				let source = TheAudioContext.createBufferSource();
				let sampleNoise = Math.random() * 2 - 1;
				source.buffer = soundBuffer;
				source.playbackRate.value = Math.pow(2, sampleNoise * 0.1);
				source.connect(TheAudioDestination);
				source.start();
		}
	}

	createAudioBuffer(array) {
		if (!Array.isArray(array)) array = [array];
		let result = TheAudioContext.createBuffer(array.length, array[0].length, contextSampleRate);
		for (let i=0; i<array.length; i++) {
			result.getChannelData(i).set(array[i]);
		}
		return result;
	}
}



let Sounds = {
	async init() {
		await TheAudioContext.audioWorklet.addModule("~/js/worklets/sound-fx-worklet.js");
		this.fxAPI = new FxAPI(TheAudioContext, "sound-fx-worklet");

		// prepare stuff
		this.prepare("reverbIR");
		this.prepare("main-song");
		this.prepare("victory-song");
	},
	prepare(name) {
		this.fxAPI.sendMessage(name);
	},
	play(name) {
		this.fxAPI.sendMessage(name);
	},
	toggle(value) {
		
	},
	destroy() {
		
	},
	setReverbDestination(reverb) {
		TheReverbDestination = TheAudioContext.createGain();
		TheReverbDestination.gain.value = 0.7;
		TheReverbDestination.connect(reverb);
		reverb.connect(TheAudioDestination);
	}
};
// auto init
Sounds.init();
