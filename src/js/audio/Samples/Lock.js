
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
