
import { Sampler, Composer } from "./common.js";


function createErrorSound() {
	let p = 0,
		volumeEnvelope = [
			[0, 0],
			[0.001, 0.5, 0.5],
			[0.5, 0],
			[0.501, 0.5, 0.5],
			[1, 0]
		];

	function getSample(t) {
		p += Sampler.getFrequencyDelta(44);
		return Sampler.sampleSawtooth(p);
	}

	return Sampler.applyEnvelope(Sampler.lowPassFilter(Sampler.generateSound(0.25, getSample), 500, 1.5), volumeEnvelope);
}

function createLockSound() {
	let volumeEnvelope = [
			[0.0, 0.3, 0.2],
			[0.5, 0],
			[0.501, 0.5, 0.2],
			[1, 0]
		];

	return Sampler.bandPassFilter(Sampler.applyEnvelope(Sampler.generateSound(0.1, Sampler.sampleNoise), volumeEnvelope), 1800, 3);
}

function createPlaceSound() {
	let p = 0,
		volumeEnvelope = [
			[0, 0],
			[0.01, 0.5, 0.5],
			[1, 0]
		];

	function getSample (t) {
		p += Sampler.getFrequencyDelta(44);
		return Sampler.sampleTriangle(p);
	}

	return Sampler.applyEnvelope(Sampler.lowPassFilter(Sampler.generateSound(0.1, getSample), 2000), volumeEnvelope);
}

function createBassSound(frequency, length) {
	let p = 0,
		volumeEnvelope = [
			[0, 0],
			[0.01, 1, 0.9],
			[0.999, 0.43],
			[1, 0]
		];

	function getSample(t) {
		p += Sampler.getFrequencyDelta(frequency);
		return Sampler.sampleSine(p) + Sampler.sampleSine(p * 2) * 0.21;
	}

	return Sampler.applyEnvelope(Sampler.generateSound(length, getSample), volumeEnvelope);
}

function createPluckSound(frequency, length) {
	let p = 0,
		volumeEnvelope = [
			[0, 0],
			[0.01, 1, 0.9],
			[0.999, 0.43],
			[1, 0]
		];

	function getSample(t) {
		p += Sampler.getFrequencyDelta(frequency);
		return Sampler.sampleSine(p) + Sampler.sampleSine(p * 2) * 0.21;
	}

	return Sampler.applyEnvelope(Sampler.generateSound(length, getSample), volumeEnvelope);
}

function createPadsSound(frequency, length) {
	let p = 0,
		volumeEnvelope = [
			[0, 0],
			[0.01, 0.3, 0.9],
			[0.02, 0.15, 0.8],
			[0.99, 0.03],
			[1, 0]
		];

	let p1 = Math.random();
	let p2 = Math.random();
	let p3 = Math.random();
	let pN = Math.random();
	let prevY = 0;
	let lastNoiseSample = Sampler.sampleNoise();
	let yAlpha = 1 - Math.exp(-100 / sampleRate);

	let f1L = frequency * Math.pow(2, -0.1/12);
	let f2L = frequency * Math.pow(2, +0.06/12);
	let f1R = frequency * Math.pow(2, +0.1/12);
	let f2R = frequency * Math.pow(2, -0.06/12);

	function getSampleL (t) {
		p1 += Sampler.getFrequencyDelta(f1L);
		p2 += Sampler.getFrequencyDelta(f2L);
		p3 += Sampler.getFrequencyDelta(frequency);
		pN += Sampler.getFrequencyDelta(frequency * 0.25);
		if (pN >= 1) {
			pN -= 1;
			lastNoiseSample = Sampler.sampleNoise();
		}
		prevY = yAlpha * lastNoiseSample + (1 - yAlpha) * prevY;
		return Sampler.sampleSine(p1) + Sampler.sampleSine(p2 * 2) * 0.25 + Sampler.sampleSine(p3 * 4) * prevY;
	}

	function getSampleR (t) {
		p1 += Sampler.getFrequencyDelta(f1R);
		p2 += Sampler.getFrequencyDelta(f2R);
		p3 += Sampler.getFrequencyDelta(frequency);
		pN += Sampler.getFrequencyDelta(frequency * 0.25);
		if (pN >= 1) {
			pN -= 1;
			lastNoiseSample = Sampler.sampleNoise();
		}
		prevY = yAlpha * lastNoiseSample + (1 - yAlpha) * prevY;
		return Sampler.sampleSine(p1) + Sampler.sampleSine(p2 * 2) * 0.25 + Sampler.sampleSine(p3 * 4) * prevY;
	}

	return [
		Sampler.applyEnvelope(Sampler.generateSound(length, getSampleL), volumeEnvelope),
		Sampler.applyEnvelope(Sampler.generateSound(length, getSampleR), volumeEnvelope)
	];
}

function createReverbIR() {
	function createNoisyEnvelope () {
		let t = 0;
		let result = [];
		do {
			result.push([t, Math.random()]);
			t += 0.01;
		} while (t <= 1);

		return result;
	}

	let volumeEnvelope1 = createNoisyEnvelope();
	let volumeEnvelope2 = createNoisyEnvelope();
	let globalEnvelope = [
		[0, 0, 0.5],
		[0.05, 1, 0.5],
		[1, 0]
	];

	let left, right, sound, envelope;
	// left
	sound = Sampler.generateSound(4, Sampler.sampleNoise);
	envelope = Sampler.applyEnvelope(sound, volumeEnvelope1);
	left = Sampler.applyEnvelope(envelope, globalEnvelope);
	// right
	sound = Sampler.generateSound(4, Sampler.sampleNoise);
	envelope = Sampler.applyEnvelope(sound, volumeEnvelope2);
	right = Sampler.applyEnvelope(envelope, globalEnvelope);
	// result
	return [left, right];
}

function createVictorySong() {
	let trackBeatCount = 8;
	let bpm = 55;

	function createMelodyTrack() {
		let output = [
				Composer.createTempBuffer(trackBeatCount, bpm),
				Composer.createTempBuffer(trackBeatCount, bpm)
			];

		Composer.addNotes([
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

		Sampler.applyEnvelope(output[0], fadeOut);
		Sampler.applyEnvelope(output[1], fadeOut);

		return output;
		// return Sampler.createAudioBuffer(output);
	}

	let configs = [{ output: createMelodyTrack(), volume: 0.32, sendToReverb: 2 }];

	return { configs, loop: false };
}

function createMainSong() {
	function createBassTrack() {
		let loop = Composer.createTempBuffer(8 * 4, bpm);
		Composer.addNotes([
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
		Composer.addNotes([
			[12, -39, 4],
		], loop2, createBassSound, bpm, true);

		// await waitForNextFrame();

		let output = Composer.createTempBuffer(trackBeatCount, bpm);
		output.set(loop, 0);
		output.set(loop2, Composer.getOffsetForBar(8, bpm));
		output.set(loop, Composer.getOffsetForBar(16, bpm));
		output.set(loop2, Composer.getOffsetForBar(24, bpm));

		return output;
	}

	function createPadsTrack() {
		function createChord(notes) {
			let clip = [
				Composer.createTempBuffer(4, bpm),
				Composer.createTempBuffer(4, bpm)
			];

			Composer.addNotes(notes.map(x => [0, x, 4]), clip, createPadsSound, bpm);
			return clip;
		}

		let output = [
			Composer.createTempBuffer(trackBeatCount, bpm),
			Composer.createTempBuffer(trackBeatCount, bpm)
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
			let offset = Composer.getOffsetForBar(i, bpm);

			output[0].set(chord[0], offset);
			output[1].set(chord[1], offset);

			let offset2 = Composer.getOffsetForBar(i + 16, bpm);

			output[0].set(chord[0], offset2);
			output[1].set(chord[1], offset2);
		}

		return output;
	}

	function createMelodyTrack () {
		let main = Composer.createTempBuffer(16 * 4, bpm);

		// First the common part...
		Composer.addNotes([
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
		let offset = Composer.getOffsetForBar(8, bpm);
		main.set(main.slice(0, offset), offset);

		// await waitForNextFrame();

		// Then add the notes that are different
		Composer.addNotes([
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

		let output = Composer.createTempBuffer(trackBeatCount, bpm);
		output.set(main, Composer.getOffsetForBar(16, bpm));

		return output;
	}

	let bpm = 55;
	let trackBeatCount = 128;
	let bufferBass = createBassTrack();
	let bufferPads = createPadsTrack();
	let bufferMelody = createMelodyTrack();

	let configs = [
		{ output: bufferBass, volume: 0.2 },
		{ output: bufferPads, volume: 0.32, sendToReverb: 2 },
		{ output: bufferMelody, volume: 0.2, sendToReverb: 2 }
	];

	return { configs, loop: true };
}


let SoundBank = {
	init() {
		this.error = createErrorSound();
		this.lock = createLockSound();
		this.place = createPlaceSound();
		this.reverbIR = createReverbIR();

		this["main-song"] = createMainSong();
		this["victory-song"] = createVictorySong();
	}
};


export default SoundBank;
