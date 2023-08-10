
function saveProgress (progress) {
	window.localStorage.setItem(GAME_ID, progress);
}

function loadProgress () {
	return +window.localStorage.getItem(GAME_ID);
}
