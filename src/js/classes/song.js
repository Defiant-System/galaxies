
class Song {
	constructor(options) {
		this.loop = options.loop;
		this.playing = false;

		let master = TheAudioContext.createGain();

		this.channels = options.configs.map(config => {
			let gainNode = TheAudioContext.createGain();

			gainNode.connect(master);

			if (config.sendToReverb) {
				let gain = TheAudioContext.createGain();
				gain.gain.value = config.sendToReverb;
				gainNode.connect(gain);
				gain.connect(TheReverbDestination);
			}

			return {
				buffer: config.buffer,
				sourceTarget: gainNode,
				volume: config.volume,
				volumeParam: gainNode.gain
			};
		});

		master.connect(TheAudioDestination);
	}

	duckForABit() {
		if (this._stopped) return;
		this.channels.forEach(channel => {
			channel.volumeParam.linearRampToValueAtTime(0, TheAudioContext.currentTime + 0.02);
			channel.volumeParam.linearRampToValueAtTime(channel.volume, TheAudioContext.currentTime + 4);
		});
	}

	stop() {
		if (!this.playing) return;
		this._stopped = true;
		this.playing = false;
		this.channels.forEach(channel => {
			channel.source.playbackRate.setValueAtTime(0, TheAudioContext.currentTime);
			channel.source.playbackRate.linearRampToValueAtTime(0, TheAudioContext.currentTime);
			channel.source.stop();
		})
	}

	play() {
		this.playing = true;
		this.channels.forEach(channel => {
			if (channel.source) channel.source.disconnect();

			let sourceNode = TheAudioContext.createBufferSource();
			sourceNode.loop = this.loop;
			sourceNode.loopEnd = channel.buffer.duration;
			sourceNode.buffer = channel.buffer;
			sourceNode.connect(channel.sourceTarget);
			sourceNode.start();
			channel.source = sourceNode;
			channel.volumeParam.value = channel.volume;
		});
	}
}
