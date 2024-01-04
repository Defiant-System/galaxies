
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
