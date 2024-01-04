
let TheAudioContext = new window.AudioContext({ sampleRate: 22050 });
let TheAudioDestination = TheAudioContext.createDynamicsCompressor();
let TheReverbDestination;
let contextSampleRate = TheAudioContext.sampleRate;

TheAudioDestination.connect(TheAudioContext.destination);


function setReverbDestination (reverb) {
	TheReverbDestination = TheAudioContext.createGain();
	TheReverbDestination.gain.value = 0.7;
	TheReverbDestination.connect(reverb);
	reverb.connect(TheAudioDestination);
}
