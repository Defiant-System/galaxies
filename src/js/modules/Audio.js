
function playSample (sample) {
	return console.log("TheAudioContext", sample);
	
	let source = TheAudioContext.createBufferSource();
	source.buffer = sample;
	source.playbackRate.value = Math.pow(2, sampleNoise() * 0.1);
	source.connect(TheAudioDestination);
	source.start();
}
