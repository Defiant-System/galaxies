
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
