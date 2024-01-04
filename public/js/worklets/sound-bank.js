
import { SG } from "./common.js";


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
		p += SG.getFrequencyDelta(44);
		return SG.sampleSawtooth(p);
	}

	return SG.applyEnvelope(SG.lowPassFilter(SG.generateSound(0.25, getSample), 500, 1.5), volumeEnvelope);
}

function createLockSound() {
	let volumeEnvelope = [
			[0.0, 0.3, 0.2],
			[0.5, 0],
			[0.501, 0.5, 0.2],
			[1, 0]
		];

	return SG.bandPassFilter(SG.applyEnvelope(SG.generateSound(0.1, SG.sampleNoise), volumeEnvelope), 1800, 3);
}

function createPlaceSound() {
	let p = 0,
		volumeEnvelope = [
			[0, 0],
			[0.01, 0.5, 0.5],
			[1, 0]
		];

	function getSample (t) {
		p += SG.getFrequencyDelta(44);
		return SG.sampleTriangle(p);
	}

	return SG.applyEnvelope(SG.lowPassFilter(SG.generateSound(0.1, getSample), 2000), volumeEnvelope);
}


let SoundBank = {
	init() {
		this.error = createErrorSound();
		this.lock = createLockSound();
		this.place = createPlaceSound();
	}
};


export default SoundBank;
