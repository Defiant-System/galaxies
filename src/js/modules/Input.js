
let Input = {
	mouseX: 300,
	mouseY: 300,
	pointerDown: false,
	dispatch(event) {
		switch (event.type) {
			case "mousedown":
				Input.pointerDown = true;
				break;
			case "mousemove":
				Input.mouseX = event.layerX;
				Input.mouseY = event.layerY;
				break;
			case "mouseup":
				Input.pointerDown = false;
				break;
		}
	}
};

// bind events
TheCanvas.on("mousedown mousemove mouseup", Input.dispatch);
