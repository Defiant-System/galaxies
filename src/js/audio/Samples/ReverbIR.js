
function createReverbIR () {

	function createNoisyEnvelope () {
		let t = 0;
		let result = [];
		do {
			result.push([t, Math.random()]);
			t += 0.01;
		} while (t <= 1);

		return result;
	}

	let volumeEnvelope1 = createNoisyEnvelope();
	let volumeEnvelope2 = createNoisyEnvelope();
	let globalEnvelope = [
		[0, 0, 0.5],
		[0.05, 1, 0.5],
		[1, 0]
	];

	return [
		Soundgeneration.applyEnvelope(
			Soundgeneration.applyEnvelope(
				Soundgeneration.generateSound(4, Soundgeneration.sampleNoise),
				volumeEnvelope1
			),
			globalEnvelope
		),
		Soundgeneration.applyEnvelope(
			Soundgeneration.applyEnvelope(
				Soundgeneration.generateSound(4, Soundgeneration.sampleNoise),
				volumeEnvelope2
			),
			globalEnvelope
		)
	];
}
