

let TheAudioContext = new window.AudioContext({ sampleRate: 22050 });
let TheAudioDestination = TheAudioContext.createDynamicsCompressor();
let contextSampleRate = TheAudioContext.sampleRate;
let TheReverbDestination;

TheAudioDestination.connect(TheAudioContext.destination);


let Sounds = {
	async init() {
		await TheAudioContext.audioWorklet.addModule("~/js/worklets/sound-fx-worklet.js");
		this.fxAPI = new FxAPI(TheAudioContext, "sound-fx-worklet");

		// prepare stuff
		this.prepare("reverbIR");
		this.prepare("main-song");
		this.prepare("victory-song");
	},
	prepare(name) {
		this.fxAPI.sendMessage(name);
	},
	play(name) {
		this.fxAPI.sendMessage(name);
	},
	toggle(value) {
		
	},
	destroy() {
		
	},
	setReverbDestination(reverb) {
		TheReverbDestination = TheAudioContext.createGain();
		TheReverbDestination.gain.value = 0.7;
		TheReverbDestination.connect(reverb);
		reverb.connect(TheAudioDestination);
	}
};
// auto init
Sounds.init();
