
let Sounds = async (APP) => {

	@import "../audio/Context.js"
	@import "../audio/SoundGeneration.js"
	@import "../audio/SongGeneration.js"
	@import "../audio/Song.js"

	@import "../audio/MusicSamples/Bass.js"
	@import "../audio/MusicSamples/Pads.js"
	@import "../audio/MusicSamples/Pluck.js"

	@import "../audio/MainSong.js"
	@import "../audio/VictorySong.js"

	@import "../audio/Samples/Error.js"
	@import "../audio/Samples/Lock.js"
	@import "../audio/Samples/Place.js"
	@import "../audio/Samples/ReverbIR.js"

	// createReverb
	let Bank = {
			error: Soundgeneration.createAudioBuffer(await createErrorSound()),
			place: Soundgeneration.createAudioBuffer(await createPlaceSound()),
			lock: Soundgeneration.createAudioBuffer(await createLockSound()),
		};

	let reverb = TheAudioContext.createConvolver();
	reverb.buffer = Soundgeneration.createAudioBuffer(createReverbIR());
	setReverbDestination(reverb);

	APP.audio = {
		_playing: true,
		MainSong: await createMainSong(),
		VictorySong: await createVictorySong(),
		play(name) {
			if (!this._playing) return;
			let source = TheAudioContext.createBufferSource();
			source.buffer = Bank[name];
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
};
