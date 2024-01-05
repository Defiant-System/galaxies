
class FxAPI extends AudioWorkletNode {
	constructor(context, processor) {
		super(context, processor);
		this.port.onmessage = this.handleMessage.bind(this);
	}

	sendMessage(name) {
		let contextTimestamp = this.context.currentTime;
		this.port.postMessage({ name, contextTimestamp });
	}

	handleMessage(event) {
		let name = event.data.name;
		switch (name) {
			case "progress":
				console.log(event.data);
				break;
			case "main-song":
			case "victory-song":
				let options = event.data.buffer;
				options.configs.map(item => { item.buffer = this.createAudioBuffer(item.output) });
				Sounds[name] = new Song(options);
				// start playing main song as soon as it is possible
				// if (name === "main-song") Sounds[name].play();
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
