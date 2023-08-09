
let Input = {
	mouseX: 300,
	mouseY: 300,
	usingMouse: true,
	pointerDown: false,
	dispatch(event) {
		switch (event.type) {
			case "mousedown":
				break;
			case "mousemove":
				Input.mouseX = event.layerX;
				Input.mouseY = event.layerY;
				break;
			case "mouseup":
				break;
		}
	}
};

// bind events
TheCanvas.on("mousedown mousemove mouseup", Input.dispatch);

// function updateMousePos (e) {
// 	Input.mouseX = e.pageX;
// 	Input.mouseY = e.pageY;
// }

// TheCanvas[0].addEventListener('mousedown', e => {
// 	if (!Input.usingMouse) {
// 		return;
// 	}

// 	if (e.button === 0) {
// 		updateMousePos(e)
// 		Input.pointerDown = true;
// 	}
// });

// document.body.addEventListener('mouseup', e => {
// 	if (!Input.usingMouse) {
// 		return;
// 	}

// 	if (e.button === 0) {
// 		updateMousePos(e);
// 		Input.pointerDown = false;
// 	}
// });

// document.addEventListener('gesturestart', e => {
// 	e.preventDefault();
// });

// let touchStartPositions = {};

// function onMouseMove (e) {
// 	Input.usingMouse = true
// 	updateMousePos(e)
// }

// function onTouchStart(e) {
// 	document.body.removeEventListener('mousemove', onMouseMove)

// 	Input.usingMouse = false

// 	for (const touch of e.changedTouches) {
// 		touchStartPositions[touch.identifier] = touch
// 	}

// 	if (e.touches.length > 1) {
// 		// Input.onPanStart(touchStartPositions)
// 	} else {
// 		updateMousePos(e.changedTouches[0])
// 		Input.pointerDown = true
// 	}
// }

// function onTouchMove (e) {
// 	updateMousePos(e.touches[0])

// 	const touchPositions = {}
// 	for (const touch of e.touches) {
// 		touchPositions[touch.identifier] = touch
// 	}

// 	// Input.onPanUpdate(touchPositions)
// }

// function onTouchEnd (e) {
// 	for (const touch of e.changedTouches) {
// 		delete touchStartPositions[touch.identifier]
// 	}

// 	if (e.touches.length <= 1) {
// 		Input.pointerDown = false
// 		// Input.onPanEnd()
// 	}
// }

// document.body.addEventListener('mousemove', onMouseMove)

// TheCanvas[0].addEventListener('touchstart', onTouchStart)
// TheCanvas[0].addEventListener('touchmove', onTouchMove)
// TheCanvas[0].addEventListener('touchend', onTouchEnd)
// TheCanvas[0].addEventListener('touchcancel', onTouchEnd)
