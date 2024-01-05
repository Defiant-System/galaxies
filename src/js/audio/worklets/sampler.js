
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
