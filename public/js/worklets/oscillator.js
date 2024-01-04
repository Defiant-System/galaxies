
/**
 * A simple bypass node demo.
 *
 * @class GainProcessor
 * @extends AudioWorkletProcessor
 */

class Oscillator extends AudioWorkletProcessor {
	
	prevFreq = 440
	d = 0

	static get parameterDescriptors() {
		return [{
			name: 'frequency',
			defaultValue: 440,
			minValue: 0,
			maxValue: 0.5 * sampleRate,
			automationRate: "a-rate"
		}];
	}

	process (inputs, outputs, parameters) {
		let output = outputs[0];
		let freqs = parameters.frequency;

		output.forEach(channel => {
			for (let i = 0; i < channel.length; i++) {
				let freq = freqs.length > 1 ? freqs[i] : freqs[0];
				let globTime = currentTime + i / sampleRate;
				this.d += globTime * (this.prevFreq - freq);
				this.prevFreq = freq;
				let time = globTime * freq + this.d;
				let vibrato = Math.sin(globTime * 2 * Math.PI * 7) * 2
				channel[i] = Math.sin(2 * Math.PI * time + vibrato);
			}
		});

		return true;
	}
}

registerProcessor("oscillator", Oscillator);
