
let Test = {
	init(APP) {
		
		setTimeout(() => APP.dispatch({ type: "new-game" }), 500);
		// setTimeout(() => APP.dispatch({ type: "open-help" }), 100);

	}
};
