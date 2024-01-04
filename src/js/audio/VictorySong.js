
async function createVictorySong() {
	let trackBeatCount = 8;
	let bpm = 55;

	async function createMelodyTrack() {
		let output = [
				SongGeneration.createTempBuffer(trackBeatCount, bpm),
				SongGeneration.createTempBuffer(trackBeatCount, bpm)
			];

		SongGeneration.addNotes([
				[0, -19, 4],
				[0.1, -12, 4],
				[0.2, -7, 4],
				[0.3, -3, 4],

				[0.4, 5, 4],
			], output, createPadsSound, bpm);

		let fadeOut = [
				[0, 1],
				[0.2, 1, 0.9],
				[1, 0]
			];

		Soundgeneration.applyEnvelope(output[0], fadeOut);
		Soundgeneration.applyEnvelope(output[1], fadeOut);

		return Soundgeneration.createAudioBuffer(output);
	}

	let [bufferMelody] = await Promise.all([createMelodyTrack()]);

	return new Song([{ buffer: bufferMelody, volume: 0.32, sendToReverb: 2 }], false);
}
