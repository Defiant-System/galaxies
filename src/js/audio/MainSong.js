
// async function waitForNextFrame() {
// 	await new Promise(resolve => requestAnimationFrame(resolve));
// }

async function createMainSong () {
	async function createBassTrack () {
		let loop = SongGeneration.createTempBuffer(8 * 4, bpm);
		SongGeneration.addNotes([
			[0, -31, 4],
			[4, -35, 4],
			[8, -31, 4],
			[12, -40, 4],
			[16, -38, 4],
			[20, -36, 4],
			[24, -35, 4],
			[28, -33, 4]
		], loop, createBassSound, bpm, true);

		let loop2 = new Float32Array(loop);
		// Change one note in the second loop
		SongGeneration.addNotes([
			[12, -39, 4],
		], loop2, createBassSound, bpm, true);

		// await waitForNextFrame();

		let output = SongGeneration.createTempBuffer(trackBeatCount, bpm);
		output.set(loop, 0);
		output.set(loop2, SongGeneration.getOffsetForBar(8, bpm));
		output.set(loop, SongGeneration.getOffsetForBar(16, bpm));
		output.set(loop2, SongGeneration.getOffsetForBar(24, bpm));

		return Soundgeneration.createAudioBuffer(output);
	}

	async function createPadsTrack () {
		function createChord (notes) {
			let clip = [
				SongGeneration.createTempBuffer(4, bpm),
				SongGeneration.createTempBuffer(4, bpm)
			];

			SongGeneration.addNotes(notes.map(x => [0, x, 4]), clip, createPadsSound, bpm);
			return clip;
		}

		let output = [
			SongGeneration.createTempBuffer(trackBeatCount, bpm),
			SongGeneration.createTempBuffer(trackBeatCount, bpm)
		];

		let d_5_9 = createChord([-19, -12, -5]);
		let bb_5_9 = createChord([-23, -16, -9]);
		let f_8_12 = createChord([-28, -16, -9]);

		// await waitForNextFrame();

		let g_5_9_12 = createChord([-26, -19, -12, -7]);
		let a_5_8_10 = createChord([-24, -17, -12, -9]);

		// await waitForNextFrame();

		let bb_5_9_12 = createChord([-23, -16, -9, -4]);
		let c_5_8_13 = createChord([-21, -14, -9, 0]);

		// await waitForNextFrame();

		let d_5_10maj = createChord([-19, -12, -3]);
		let bb_5_10 = createChord([-23, -16, -7]);
		let gb_8_13a = createChord([-27, -15, -7]);

		// await waitForNextFrame();

		let bb_5_10_12 = createChord([-23, -16, -7, -4]);
		let c_5_8_10 = createChord([-21, -14, -9, -5]);

		let chordProgression = [
			d_5_9,
			bb_5_9,
			d_5_9,
			f_8_12,
			g_5_9_12,
			a_5_8_10,
			bb_5_9_12,
			c_5_8_13,

			d_5_10maj,
			bb_5_10,
			d_5_10maj,
			gb_8_13a,
			g_5_9_12,
			a_5_8_10,
			bb_5_10_12,
			c_5_8_10
		];

		for (let i = 0; i < chordProgression.length; i++) {
			let chord = chordProgression[i];
			let offset = SongGeneration.getOffsetForBar(i, bpm);

			output[0].set(chord[0], offset);
			output[1].set(chord[1], offset);

			let offset2 = SongGeneration.getOffsetForBar(i + 16, bpm);

			output[0].set(chord[0], offset2);
			output[1].set(chord[1], offset2);
		}

		return Soundgeneration.createAudioBuffer(output);
	}

	async function createMelodyTrack () {
		let main = SongGeneration.createTempBuffer(16 * 4, bpm);

		// First the common part...
		SongGeneration.addNotes([
			[16, 5],
			[17, 12],
			[18, 8],
			[19, 3],

			[20, 5],
			[22, 0],
			[23, 3],

			[24, 5],
			[25, 12],
			[26, 8],
			[27, 15],

			[28, 7],
		], main, createPluckSound, bpm, true);

		// Then copy it over...
		let offset = SongGeneration.getOffsetForBar(8, bpm);
		main.set(main.slice(0, offset), offset);

		// await waitForNextFrame();

		// Then add the notes that are different
		SongGeneration.addNotes([
			// part 1
			[0, 5],
			[1, 12],
			[2, 8],
			[3, 3],

			[4, 5],

			[8, 5],
			[9, 12],
			[10, 8],
			[11, 15],

			[12, 5],

			// part 2
			[32, 5],
			[33, 12],
			[34, 10],
			[35, 9],

			[36, 8],
			[38, 5],
			[39, 3],

			[40, 5],
			[41, 12],
			[42, 9],
			[43, 15],

			[44, 5],
		], main, createPluckSound, bpm, true);

		// await waitForNextFrame();

		let output = SongGeneration.createTempBuffer(trackBeatCount, bpm);
		output.set(main, SongGeneration.getOffsetForBar(16, bpm));

		return Soundgeneration.createAudioBuffer(output);
	}

	let bpm = 55;
	let trackBeatCount = 128;

	let bufferBass = await createBassTrack();
	// let bufferPads = await createPadsTrack();
	// let bufferMelody = await createMelodyTrack();

	// return new Song(
	// 	[
	// 		{ buffer: bufferBass, volume: 0.2 },
	// 		{ buffer: bufferPads, volume: 0.32, sendToReverb: 2 },
	// 		{ buffer: bufferMelody, volume: 0.2, sendToReverb: 2 }
	// 	],
	// 	true
	// );
}
