
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
