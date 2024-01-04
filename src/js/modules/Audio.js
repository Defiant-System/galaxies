
(async () => {

	@import "../audio/Context.js"
	@import "../audio/SoundGeneration.js"
	@import "../audio/SongGeneration.js"
	@import "../audio/Song.js"

	@import "../audio/MusicSamples/Bass.js"
	@import "../audio/MusicSamples/Pads.js"
	@import "../audio/MusicSamples/Pluck.js"

	@import "../audio/MainSong.js"

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


	Bank.MainSong = await createMainSong();
	// Bank.VictorySong = await createVictorySong();


	function play(name) {
		let source = TheAudioContext.createBufferSource();
		source.buffer = Bank[name];
		source.playbackRate.value = Math.pow(2, Soundgeneration.sampleNoise() * 0.1);
		source.connect(TheAudioDestination);
		source.start();
	}

	// Sounds = { play };
	play("lock");

	setTimeout(() => play("place"), 1000);
	// Bank.MainSong.play();

})();
