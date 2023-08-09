
let MainSong
let VictorySong
let ErrorSound
let PlaceSound
let LockSound

let StarFieldTexture

function createReverb () {
	const reverb = TheAudioContext.createConvolver()
	reverb.buffer = createAudioBuffer(createReverbIR())

	setReverbDestination(reverb)
}

async function loadAssets () {
	StarFieldTexture = await generateStarField()

	ErrorSound = createAudioBuffer(await createErrorSound())
	PlaceSound = createAudioBuffer(await createPlaceSound())
	LockSound = createAudioBuffer(await createLockSound())

	createReverb()

	MainSong = await createMainSong()
	VictorySong = await createVictorySong()
}
