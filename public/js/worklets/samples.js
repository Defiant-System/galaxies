
import { SG } from "./common.js";


function createErrorSound () {
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

	return SG.applyEnvelope(
			SG.lowPassFilter(
				SG.generateSound(0.25, getSample), 500, 1.5), volumeEnvelope);
}

let Bank = {
	init() {
		this.error = createErrorSound();
	}
};


export default Bank;
