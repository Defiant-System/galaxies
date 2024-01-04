
function createPadsSound(frequency, length) {
	let p = 0,
		volumeEnvelope = [
			[0, 0],
			[0.01, 0.3, 0.9],
			[0.02, 0.15, 0.8],
			[0.99, 0.03],
			[1, 0]
		];

	let p1 = Math.random()
	let p2 = Math.random()
	let p3 = Math.random()
	let pN = Math.random()
	let prevY = 0
	let lastNoiseSample = Soundgeneration.sampleNoise()
	let yAlpha = 1 - Math.exp(-100 / contextSampleRate)

	let f1L = frequency * Math.pow(2, -0.1/12)
	let f2L = frequency * Math.pow(2, +0.06/12)
	let f1R = frequency * Math.pow(2, +0.1/12)
	let f2R = frequency * Math.pow(2, -0.06/12)

	function getSampleL (t) {
		p1 += Soundgeneration.getFrequencyDelta(f1L)
		p2 += Soundgeneration.getFrequencyDelta(f2L)
		p3 += Soundgeneration.getFrequencyDelta(frequency)
		pN += Soundgeneration.getFrequencyDelta(frequency * 0.25)
		if (pN >= 1) {
			pN -= 1
			lastNoiseSample = Soundgeneration.sampleNoise()
		}
		prevY = yAlpha * lastNoiseSample + (1 - yAlpha) * prevY
		return Soundgeneration.sampleSine(p1) + Soundgeneration.sampleSine(p2 * 2) * 0.25 + Soundgeneration.sampleSine(p3 * 4) * prevY
	}

	function getSampleR (t) {
		p1 += Soundgeneration.getFrequencyDelta(f1R)
		p2 += Soundgeneration.getFrequencyDelta(f2R)
		p3 += Soundgeneration.getFrequencyDelta(frequency)
		pN += Soundgeneration.getFrequencyDelta(frequency * 0.25)
		if (pN >= 1) {
			pN -= 1
			lastNoiseSample = Soundgeneration.sampleNoise()
		}
		prevY = yAlpha * lastNoiseSample + (1 - yAlpha) * prevY
		return Soundgeneration.sampleSine(p1) + Soundgeneration.sampleSine(p2 * 2) * 0.25 + Soundgeneration.sampleSine(p3 * 4) * prevY
	}

	return [
		Soundgeneration.applyEnvelope(Soundgeneration.generateSound(length, getSampleL), volumeEnvelope),
		Soundgeneration.applyEnvelope(Soundgeneration.generateSound(length, getSampleR), volumeEnvelope)
	]
}
