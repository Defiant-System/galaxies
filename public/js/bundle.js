let TheAudioContext = new window.AudioContext({ sampleRate: 22050 });
let TheAudioDestination = TheAudioContext.createDynamicsCompressor();
let TheReverbDestination;
let contextSampleRate = TheAudioContext.sampleRate;

TheAudioDestination.connect(TheAudioContext.destination);


function setReverbDestination (reverb) {
	TheReverbDestination = TheAudioContext.createGain();
	TheReverbDestination.gain.value = 0.7;
	TheReverbDestination.connect(reverb);
	reverb.connect(TheAudioDestination);
}


let Soundgeneration = {
	createAudioBuffer(array) {
		if (!Array.isArray(array)) array = [array];

		let result = TheAudioContext.createBuffer(array.length, array[0].length, contextSampleRate);
		for (let i = 0; i < array.length; i++) {
			result.getChannelData(i).set(array[i]);
		}

		return result
	},
	sampleSine (position) {
		return Math.sin(2 * Math.PI * position);
	},
	sampleSawtooth (position) {
		return (position % 1) * 2 - 1;
	},
	sampleTriangle (position) {
		return Math.abs((position % 1) * 2 - 1) * 2 - 1;
	},
	sampleSquare (position) {
		return samplePulse(position, 0.5);
	},
	samplePulse (position, length) {
		return (position % 1 < length) * 2 - 1;
	},
	sampleNoise () {
		return Math.random() * 2 - 1;
	},
	lowPassFilter (buffer, frequencies, Q = Math.SQRT1_2) {
		let freqSampler = new EnvelopeSampler(ensureEnvelope(frequencies), true);
		let qSampler = new EnvelopeSampler(ensureEnvelope(Q));

		return filter(buffer, x => getLowPassCoefficients(freqSampler.sample(x), qSampler.sample(x)));
	},
	highPassFilter (buffer, frequencies, Q = Math.SQRT1_2) {
		let freqSampler = new EnvelopeSampler(ensureEnvelope(frequencies), true);
		let qSampler = new EnvelopeSampler(ensureEnvelope(Q));

		return filter(buffer, x => getHighPassCoefficients(freqSampler.sample(x), qSampler.sample(x)));
	},
	bandPassFilter (buffer, frequencies, Q = Math.SQRT1_2) {
		let freqSampler = new EnvelopeSampler(ensureEnvelope(frequencies), true);
		let qSampler = new EnvelopeSampler(ensureEnvelope(Q));

		return filter(buffer, x => getBandPassCoefficients(freqSampler.sample(x), qSampler.sample(x)));
	},
	highShelf (buffer, cutOffFrequencies, Q, gainFactor) {
		let freqSampler = new EnvelopeSampler(ensureEnvelope(cutOffFrequencies), true);
		let qSampler = new EnvelopeSampler(ensureEnvelope(Q));
		let gainSampler = new EnvelopeSampler(ensureEnvelope(gainFactor));

		return filter(buffer, x => getHighShelfCoefficients(freqSampler.sample(x), qSampler.sample(x), gainSampler.sample(x)));
	},
	peakFilter (buffer, frequencies, Q, gainFactor) {
		let freqSampler = new EnvelopeSampler(ensureEnvelope(frequencies), true);
		let qSampler = new EnvelopeSampler(ensureEnvelope(Q));
		let gainSampler = new EnvelopeSampler(ensureEnvelope(gainFactor));

		return filter(buffer, x => getPeakFilterCoefficients(freqSampler.sample(x), qSampler.sample(x), gainSampler.sample(x)));
	},
	distort (buffer, amount) {
		for (let i = 0; i < buffer.length; i++) {
			buffer[i] *= amount;
			if (buffer[i] < -1) buffer[i] = -1;
			else if (buffer[i] > 1) buffer[i] = 1;
			else buffer[i] = Math.sin(buffer[i] * Math.PI / 2);
			buffer[i] /= amount;
		}
		return buffer;
	},
	sumSounds (buffers) {
		return combineSounds(buffers, (data, bufferIndex, bufferData, sampleIndex, bufferCount) => {
			data[sampleIndex] += bufferData[sampleIndex] / bufferCount;
		});
	},
	multiplySounds (buffers) {
		return combineSounds(buffers, (data, bufferIndex, bufferData, sampleIndex, bufferCount) => {
			if (bufferIndex === 0) {
				data[sampleIndex] = 1;
			}
			data[sampleIndex] *= bufferData[sampleIndex] / bufferCount;
		});
	},
	generateSound (length, sampleFunction) {
		let buffer = new Float32Array(length * contextSampleRate);

		for (let i = 0; i < buffer.length; i++) {
			buffer[i] = sampleFunction(i / buffer.length, i / contextSampleRate);
		}

		return buffer;
	},
	applyEnvelope (buffer, envelope) {
		let sampler = new EnvelopeSampler(envelope);
		for (let i = 0; i < buffer.length; i++) {
			buffer[i] *= sampler.sample(i / buffer.length);
		}

		return buffer;
	},
	getFrequencyDelta (freq) {
		return freq / contextSampleRate;
	}
};


function combineSounds (buffers, func) {
	let maxLength = 0;
	buffers.forEach(buffer => { maxLength = Math.max(maxLength, buffer.length); });

	let outputBuffer = new Float32Array(maxLength);

	buffers.forEach((buffer, j) => {
		for (let i = 0; i < buffer.length; i++) {
			func(outputBuffer, j, buffer, i, buffers.length);
		}
	});

	return outputBuffer;
}

function ensureEnvelope (envelopeOrValue) {
	if (typeof envelopeOrValue === 'number') {
		return [[0, envelopeOrValue], [1, envelopeOrValue]];
	}
	return envelopeOrValue;
}

function coefficients (b0, b1, b2, a0, a1, a2) {
	return [
		b0 / a0,
		b1 / a0,
		b2 / a0,
		a1 / a0,
		a2 / a0
	];
}

function getHighPassCoefficients (frequency, Q) {
	let n = Math.tan(Math.PI * frequency / contextSampleRate);
	let nSquared = n * n;
	let invQ = 1 / Q;
	let c1 = 1 / (1 + invQ * n + nSquared);

	return coefficients(
		c1, c1 * -2,
		c1, 1,
		c1 * 2 * (nSquared - 1),
		c1 * (1 - invQ * n + nSquared)
	);
}

function getLowPassCoefficients (frequency, Q) {
	let n = 1 / Math.tan(Math.PI * frequency / contextSampleRate);
	let nSquared = n * n;
	let invQ = 1 / Q;
	let c1 = 1 / (1 + invQ * n + nSquared);

	return coefficients(
		c1, c1 * 2,
		c1, 1,
		c1 * 2 * (1 - nSquared),
		c1 * (1 - invQ * n + nSquared)
	);
}

function getBandPassCoefficients (frequency, Q) {
	let n = 1 / Math.tan(Math.PI * frequency / contextSampleRate);
	let nSquared = n * n;
	let invQ = 1 / Q;
	let c1 = 1 / (1 + invQ * n + nSquared);

	return coefficients(
		c1 * n * invQ, 0,
		-c1 * n * invQ, 1,
		c1 * 2 * (1 - nSquared),
		c1 * (1 - invQ * n + nSquared)
	);
}

function getHighShelfCoefficients (cutOffFrequency, Q, gainFactor) {
	let A = Math.sqrt(gainFactor);
	let aminus1 = A - 1;
	let aplus1 = A + 1;
	let omega = (Math.PI * 2 * cutOffFrequency) / contextSampleRate;
	let coso = Math.cos(omega);
	let beta = Math.sin(omega) * Math.sqrt(A) / Q;
	let aminus1TimesCoso = aminus1 * coso;

	return coefficients (
		A * (aplus1 + aminus1TimesCoso + beta),
		A * -2.0 * (aminus1 + aplus1 * coso),
		A * (aplus1 + aminus1TimesCoso - beta),
		aplus1 - aminus1TimesCoso + beta,
		2.0 * (aminus1 - aplus1 * coso),
		aplus1 - aminus1TimesCoso - beta
	);
}

function getPeakFilterCoefficients (frequency, Q, gainFactor) {
	let A = Math.sqrt(gainFactor);
	let omega = (Math.PI * 2 * frequency) / sampleRate;
	let alpha = 0.5 * Math.sin(omega) / Q;
	let c2 = -2.0 * Math.cos(omega);
	let alphaTimesA = alpha * A;
	let alphaOverA = alpha / A;

	return coefficients(
		1.0 + alphaTimesA,
		c2,
		1.0 - alphaTimesA,
		1.0 + alphaOverA,
		c2,
		1.0 - alphaOverA
	);
}

function filter (buffer, coeffFunction) {
	let lv1 = 0;
	let lv2 = 0;

	for (let i = 0; i < buffer.length; ++i) {
		let coeffs = coeffFunction(i / (buffer.length - 1));
		let inV = buffer[i];
		let outV = (inV * coeffs[0]) + lv1;
		buffer[i] = outV;

		lv1 = (inV * coeffs[1]) - (outV * coeffs[3]) + lv2;
		lv2 = (inV * coeffs[2]) - (outV * coeffs[4]);
	}

	return buffer;
}


let bufferCache = {};

let SongGeneration = {
	addSoundToBuffer (sourceDataBuffer, targetDataBuffer, offset, mono = false) {
		const maxJ = Math.min(offset + sourceDataBuffer.length, targetDataBuffer.length);

		if (mono) {
			targetDataBuffer.set(sourceDataBuffer.subarray(0, maxJ - offset), offset);
		} else {
			for (let j = offset; j < maxJ; j++) {
				targetDataBuffer[j] += sourceDataBuffer[j - offset];
			}
		}
	},

	createTempBuffer (beatCount, bpm) {
		return new Float32Array(Math.ceil(contextSampleRate * beatCount * 60 / bpm))
	},

	makeNotesFromBars (notes) {
		let globalOffset = 0;
		let result = [];
		let lastOffset = 0;
		notes.forEach(([offset, ...args]) => {
			if (offset < lastOffset) {
				globalOffset += 4;
			}
			lastOffset = offset;
			result.push([globalOffset + offset, ...args]);
		});
		return result
	},

	addNotes (notes, output, instrument, bpm, mono = false) {
		if (!Array.isArray(output)) {
			output = [output];
		}

		const keyPrefix = instrument.toString().substr(0,20);
		notes.forEach(note => {
			let key = keyPrefix + note.slice(1).join('|');
			if (!bufferCache[key]) {
				bufferCache[key] = instrument(this.getFrequencyForTone(note[1]), this.getLengthInSeconds(note[2] || 1, bpm), ...note.slice(3));
			}
			if (!Array.isArray(bufferCache[key])) {
				bufferCache[key] = [bufferCache[key]];
			}
			for (let i = 0; i < output.length; i++) {
				this.addSoundToBuffer(
					bufferCache[key][i],
					output[i],
					this.getOffsetForBeat(note[0], bpm),
					mono
				);
			}
		});
	},

	getLengthInSeconds (n, bpm) {
		return n * 60 / bpm
	},

	getSamplePositionWithinBeat (n, bpm) {
		let beatDuration = contextSampleRate * 60 / bpm;
		return (n % beatDuration) / beatDuration
	},

	getOffsetForBeat (n, bpm) {
		return Math.floor(contextSampleRate * n * 60 / bpm)
	},

	getOffsetForBar (n, bpm) {
		return this.getOffsetForBeat(n * 4, bpm)
	},

	getFrequencyForTone (n) {
		return 440 * 2 ** (n / 12)
	},

	repeatNotes (note, length, repeat) {
		const result = [];
		for (let i = 0; i < repeat; i++) {
			result.push([length * i, note, length]);
		}
		return result
	},

	addOctave (notes) {
		for (let i = 0, l = notes.length; i < l; i++) {
			let [offset, note, ...rest] = notes[i];
			notes.push([offset, note + 12, ...rest]);
		}
		return notes
	},

	zipRhythmAndNotes (rhythm, notes) {
		return rhythm.map((beat, index) => {
			return [beat, notes[index]]
		})
	},

	offsetNotes (notes, amount) {
		notes.forEach(note => { note[0] += amount; });
		return notes
	},

	setNoteLengths(notes, totalBeatCount) {
		for (let i = 0; i < notes.length - 1; i++) {
			notes[i][2] = notes[i + 1][0] - notes[i][0];
		}
		notes[notes.length - 1][2] = totalBeatCount - notes[notes.length - 1][0];
		return notes
	},

	applyRepeatingEnvelope (buffer, envelope, bpm) {
		const sampler = new EnvelopeSampler(envelope);
		let prevT = 0;
		for (let i = 0; i < buffer.length; i++) {
			let t = getSamplePositionWithinBeat(i, bpm);
			if (t < prevT) {
				sampler.reset();
			}
			buffer[i] *= sampler.sample(t);
			prevT = t;
		}

		return buffer
	}
};


class Song {
	constructor (channelConfigs, loop) {
		this.channelConfigs = channelConfigs;
		this.playing = false;
		this.loop = loop;

		let master = TheAudioContext.createGain();

		this.channels = channelConfigs.map(config => {
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

	tapeStop (time = 1) {
		this.playing = false;
		this.channels.forEach(channel => {
			channel.source.playbackRate.setValueAtTime(1, TheAudioContext.currentTime);
			channel.source.playbackRate.linearRampToValueAtTime(0.001, TheAudioContext.currentTime + time);
		});
	}

	duckForABit () {
		if (this._stopped) return;
		this.channels.forEach(channel => {
			channel.volumeParam.linearRampToValueAtTime(0, TheAudioContext.currentTime + 0.02);
			channel.volumeParam.linearRampToValueAtTime(channel.volume, TheAudioContext.currentTime + 4);
		});
	}

	play () {
		if (this._stopped) return;
		this.playing = true;
		this.channels.forEach(channel => {
			if (channel.source) {
				channel.source.disconnect();
			}

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



function createBassSound(frequency, length) {
	let p = 0,
		volumeEnvelope = [
			[0, 0],
			[0.01, 1, 0.9],
			[0.999, 0.43],
			[1, 0]
		];

	function getSample(t) {
		p += Soundgeneration.getFrequencyDelta(frequency);
		return Soundgeneration.sampleSine(p) + Soundgeneration.sampleSine(p * 2) * 0.21;
	}

	return Soundgeneration.applyEnvelope(Soundgeneration.generateSound(length, getSample), volumeEnvelope);
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
	let lastNoiseSample = Soundgeneration.sampleNoise();
	let yAlpha = 1 - Math.exp(-100 / contextSampleRate);

	let f1L = frequency * Math.pow(2, -0.1/12);
	let f2L = frequency * Math.pow(2, +0.06/12);
	let f1R = frequency * Math.pow(2, +0.1/12);
	let f2R = frequency * Math.pow(2, -0.06/12);

	function getSampleL (t) {
		p1 += Soundgeneration.getFrequencyDelta(f1L);
		p2 += Soundgeneration.getFrequencyDelta(f2L);
		p3 += Soundgeneration.getFrequencyDelta(frequency);
		pN += Soundgeneration.getFrequencyDelta(frequency * 0.25);
		if (pN >= 1) {
			pN -= 1;
			lastNoiseSample = Soundgeneration.sampleNoise();
		}
		prevY = yAlpha * lastNoiseSample + (1 - yAlpha) * prevY;
		return Soundgeneration.sampleSine(p1) + Soundgeneration.sampleSine(p2 * 2) * 0.25 + Soundgeneration.sampleSine(p3 * 4) * prevY
	}

	function getSampleR (t) {
		p1 += Soundgeneration.getFrequencyDelta(f1R);
		p2 += Soundgeneration.getFrequencyDelta(f2R);
		p3 += Soundgeneration.getFrequencyDelta(frequency);
		pN += Soundgeneration.getFrequencyDelta(frequency * 0.25);
		if (pN >= 1) {
			pN -= 1;
			lastNoiseSample = Soundgeneration.sampleNoise();
		}
		prevY = yAlpha * lastNoiseSample + (1 - yAlpha) * prevY;
		return Soundgeneration.sampleSine(p1) + Soundgeneration.sampleSine(p2 * 2) * 0.25 + Soundgeneration.sampleSine(p3 * 4) * prevY
	}

	return [
		Soundgeneration.applyEnvelope(Soundgeneration.generateSound(length, getSampleL), volumeEnvelope),
		Soundgeneration.applyEnvelope(Soundgeneration.generateSound(length, getSampleR), volumeEnvelope)
	]
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
		p += Soundgeneration.getFrequencyDelta(frequency);
		return Soundgeneration.sampleSine(p) + Soundgeneration.sampleSine(p * 2) * 0.21;
	}

	return Soundgeneration.applyEnvelope(Soundgeneration.generateSound(length, getSample), volumeEnvelope);
}



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
	let bufferPads = await createPadsTrack();
	let bufferMelody = await createMelodyTrack();

	return new Song(
		[
			{ buffer: bufferBass, volume: 0.2 },
			{ buffer: bufferPads, volume: 0.32, sendToReverb: 2 },
			{ buffer: bufferMelody, volume: 0.2, sendToReverb: 2 }
		],
		true
	);
}


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



function createErrorSound () {
	let p = 0,
		volumeEnvelope = [
			[0, 0],
			[0.001, 0.5, 0.5],
			[0.5, 0],
			[0.501, 0.5, 0.5],
			[1, 0]
		];

	function getSample (t) {
		p += Soundgeneration.getFrequencyDelta(44);
		return Soundgeneration.sampleSawtooth(p);
	}

	return Soundgeneration.applyEnvelope(
			Soundgeneration.lowPassFilter(
				Soundgeneration.generateSound(0.25, getSample), 500, 1.5), volumeEnvelope);
}


function createLockSound () {
	let p = 0,
		volumeEnvelope = [
			[0.0, 0.3, 0.2],
			[0.5, 0],
			[0.501, 0.5, 0.2],
			[1, 0]
		];

	return Soundgeneration.bandPassFilter(
			Soundgeneration.applyEnvelope(
				Soundgeneration.generateSound(0.1, Soundgeneration.sampleNoise), volumeEnvelope), 1800, 3);
}


function createPlaceSound () {
	let p = 0,
		volumeEnvelope = [
			[0, 0],
			[0.01, 0.5, 0.5],
			[1, 0]
		];

	function getSample (t) {
		p += Soundgeneration.getFrequencyDelta(44);
		return Soundgeneration.sampleTriangle(p);
	}

	return Soundgeneration.applyEnvelope(
			Soundgeneration.lowPassFilter(
				Soundgeneration.generateSound(0.1, getSample), 2000), volumeEnvelope);
}


function createReverbIR () {

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

	return [
		Soundgeneration.applyEnvelope(
			Soundgeneration.applyEnvelope(
				Soundgeneration.generateSound(4, Soundgeneration.sampleNoise),
				volumeEnvelope1
			),
			globalEnvelope
		),
		Soundgeneration.applyEnvelope(
			Soundgeneration.applyEnvelope(
				Soundgeneration.generateSound(4, Soundgeneration.sampleNoise),
				volumeEnvelope2
			),
			globalEnvelope
		)
	];
}




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

		await TheAudioContext.audioWorklet.addModule("/app/ant/galaxies/js/worklets/sound-fx-worklet.js");
		this.fxAPI = new FxAPI(TheAudioContext, "sound-fx-worklet");
	},
	play(name) {
		this.fxAPI.sendMessage(name);
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


module.exports = { Sounds };
