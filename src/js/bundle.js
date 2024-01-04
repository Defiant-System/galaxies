
@import "./audio/Context.js"
@import "./audio/SoundGeneration.js"
@import "./audio/SongGeneration.js"
@import "./audio/Song.js"

@import "./audio/MusicSamples/Bass.js"
@import "./audio/MusicSamples/Pads.js"
@import "./audio/MusicSamples/Pluck.js"

@import "./audio/MainSong.js"
@import "./audio/VictorySong.js"

@import "./audio/Samples/Error.js"
@import "./audio/Samples/Lock.js"
@import "./audio/Samples/Place.js"
@import "./audio/Samples/ReverbIR.js"



class MessengerWorkletNode extends AudioWorkletNode {
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
		// console.log(`[Node:handleMessage] ${data.message} (${data.contextTimestamp})`);
		// console.log(`[Node] (${data.contextTimestamp})`, data.buffer);

		let soundBuffer = Soundgeneration.createAudioBuffer(event.data.buffer);
		let source = TheAudioContext.createBufferSource();
		source.buffer = soundBuffer;
		source.playbackRate.value = Math.pow(2, Soundgeneration.sampleNoise() * 0.1);
		source.connect(TheAudioDestination);
		source.start();
	}
}


let Sounds = {
	_playing: true,
	async init() {
		// this.bank = {
		// 	error: Soundgeneration.createAudioBuffer(await createErrorSound()),
		// 	place: Soundgeneration.createAudioBuffer(await createPlaceSound()),
		// 	lock: Soundgeneration.createAudioBuffer(await createLockSound()),
		// };

		// console.log( "bank", this.bank.error );
		/*
		// createReverb
		let reverb = TheAudioContext.createConvolver();
		reverb.buffer = Soundgeneration.createAudioBuffer(createReverbIR());
		setReverbDestination(reverb);

		// create sound segments
		this.MainSong = await createMainSong();
		this.VictorySong = await createVictorySong();

		// start playing main song
		this.MainSong.play();

		// this.play("error");
		// this.VictorySong.play();
		*/

		await TheAudioContext.audioWorklet.addModule("~/js/worklets/error-sound.js");
		this.messengerWorkletNode = new MessengerWorkletNode(TheAudioContext, "error-sound");
	},
	play(name) {
		this.messengerWorkletNode.sendMessage(name);
	},
	play2(name) {
		if (!this._playing) return;
		let source = TheAudioContext.createBufferSource();
		source.buffer = this.bank[name];
		source.playbackRate.value = Math.pow(2, Soundgeneration.sampleNoise() * 0.1);
		source.connect(TheAudioDestination);
		source.start();

		this._source = source;
	},
	toggle(value) {
		this._playing = value;
		this.MainSong._stopped = !value;
		this.VictorySong._stopped = !value;

		this.MainSong.channels.forEach(channel => {
			channel.volumeParam.linearRampToValueAtTime(value ? 1 : 0, 0);
		});
	},
	destroy() {
		TheAudioContext.close();
	}
};


module.exports = {
	Sounds,
};
