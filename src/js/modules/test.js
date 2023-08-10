
let Test = {
	init(APP) {
		
		setTimeout(() => APP.dispatch({ type: "new-game" }), 300);
		setTimeout(() => APP.dispatch({ type: "pause-game" }), 1000);
		// setTimeout(() => APP.dispatch({ type: "open-help" }), 100);

	}
};
