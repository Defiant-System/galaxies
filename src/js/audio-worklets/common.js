

let Sampler = {
	generateSound (length, sampleFunction) {
		let buffer = new Float32Array(length * sampleRate);
		for (let i = 0; i < buffer.length; i++) {
			buffer[i] = sampleFunction(i / buffer.length, i / sampleRate);
		}
		return buffer;
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
		let buffer = new Float32Array(length * sampleRate);

		for (let i = 0; i < buffer.length; i++) {
			buffer[i] = sampleFunction(i / buffer.length, i / sampleRate);
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
		return freq / sampleRate;
	}
};

let bufferCache = {};

let Composer = {
	addSoundToBuffer (sourceDataBuffer, targetDataBuffer, offset, mono = false) {
		const maxJ = Math.min(offset + sourceDataBuffer.length, targetDataBuffer.length)

		if (mono) {
			targetDataBuffer.set(sourceDataBuffer.subarray(0, maxJ - offset), offset)
		} else {
			for (let j = offset; j < maxJ; j++) {
				targetDataBuffer[j] += sourceDataBuffer[j - offset]
			}
		}
	},

	createTempBuffer (beatCount, bpm) {
		return new Float32Array(Math.ceil(sampleRate * beatCount * 60 / bpm))
	},

	makeNotesFromBars (notes) {
		let globalOffset = 0
		let result = []
		let lastOffset = 0
		notes.forEach(([offset, ...args]) => {
			if (offset < lastOffset) {
				globalOffset += 4
			}
			lastOffset = offset
			result.push([globalOffset + offset, ...args])
		})
		return result
	},

	addNotes (notes, output, instrument, bpm, mono = false) {
		if (!Array.isArray(output)) {
			output = [output]
		}

		const keyPrefix = instrument.toString().substr(0,20)
		notes.forEach(note => {
			let key = keyPrefix + note.slice(1).join('|')
			if (!bufferCache[key]) {
				bufferCache[key] = instrument(this.getFrequencyForTone(note[1]), this.getLengthInSeconds(note[2] || 1, bpm), ...note.slice(3))
			}
			if (!Array.isArray(bufferCache[key])) {
				bufferCache[key] = [bufferCache[key]]
			}
			for (let i = 0; i < output.length; i++) {
				this.addSoundToBuffer(
					bufferCache[key][i],
					output[i],
					this.getOffsetForBeat(note[0], bpm),
					mono
				)
			}
		})
	},

	getLengthInSeconds (n, bpm) {
		return n * 60 / bpm
	},

	getSamplePositionWithinBeat (n, bpm) {
		let beatDuration = sampleRate * 60 / bpm
		return (n % beatDuration) / beatDuration
	},

	getOffsetForBeat (n, bpm) {
		return Math.floor(sampleRate * n * 60 / bpm)
	},

	getOffsetForBar (n, bpm) {
		return this.getOffsetForBeat(n * 4, bpm)
	},

	getFrequencyForTone (n) {
		return 440 * 2 ** (n / 12)
	},

	repeatNotes (note, length, repeat) {
		const result = []
		for (let i = 0; i < repeat; i++) {
			result.push([length * i, note, length])
		}
		return result
	},

	addOctave (notes) {
		for (let i = 0, l = notes.length; i < l; i++) {
			let [offset, note, ...rest] = notes[i]
			notes.push([offset, note + 12, ...rest])
		}
		return notes
	},

	zipRhythmAndNotes (rhythm, notes) {
		return rhythm.map((beat, index) => {
			return [beat, notes[index]]
		})
	},

	offsetNotes (notes, amount) {
		notes.forEach(note => { note[0] += amount })
		return notes
	},

	setNoteLengths(notes, totalBeatCount) {
		for (let i = 0; i < notes.length - 1; i++) {
			notes[i][2] = notes[i + 1][0] - notes[i][0]
		}
		notes[notes.length - 1][2] = totalBeatCount - notes[notes.length - 1][0]
		return notes
	},

	applyRepeatingEnvelope (buffer, envelope, bpm) {
		const sampler = new EnvelopeSampler(envelope)
		let prevT = 0
		for (let i = 0; i < buffer.length; i++) {
			let t = getSamplePositionWithinBeat(i, bpm)
			if (t < prevT) {
				sampler.reset()
			}
			buffer[i] *= sampler.sample(t)
			prevT = t
		}

		return buffer
	}
};


class EnvelopeSampler {
	constructor (envelope, logarithmic = false) {
		this.envelope = envelope;
		this.logarithmic = logarithmic;
		this.reset();
	}

	reset () {
		this.i = 0;
	}
	
	sample (position) {
		while (this.i < this.envelope.length - 1) {
			let [t1, v1, curve = 1] = this.envelope[this.i];
			let [t2, v2] = this.envelope[this.i + 1];
			if (t1 <= position && position < t2) {
				let t = (position - t1) / (t2 - t1);
				if (curve > 1) {
					t = t ** curve;
				} else {
					t = 1 - (1 - t) ** (1 / curve);
				}
				return this.logarithmic ? v1 * (v2 / v1) ** t : v1 + t * (v2 - v1);
			}
			this.i++;
		}
		return this.envelope[this.envelope.length - 1][1];
	}
}


function combineSounds (buffers, func) {
	let maxLength = 0;
	buffers.forEach(buffer => { maxLength = Math.max(maxLength, buffer.length) });

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
	let n = Math.tan(Math.PI * frequency / sampleRate);
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
	let n = 1 / Math.tan(Math.PI * frequency / sampleRate);
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
	let n = 1 / Math.tan(Math.PI * frequency / sampleRate);
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
	let omega = (Math.PI * 2 * cutOffFrequency) / sampleRate;
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


export { Sampler, Composer };

