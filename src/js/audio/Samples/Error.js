
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
