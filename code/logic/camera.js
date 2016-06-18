'use strict';

// camera position and rotation
const camera = {
	sollRotation: {
		x: 180,
		y: 180
	},
	istRotation: {
		x: 180,
		y: 180
	},
	sollPos: {
		x: 0,
		y: 5,
		z: -40
	},
	istPos: {
		x: 0,
		y: 5,
		z: -40
	}
};

// currently pressed keys
var keyMap = [];

var invertedCamera = false;
var userControlled = false;
var zoom = 0.2;


const lookAtZ = 40;

//camera control
function initInteraction(canvas) {
	const mouse = {
		pos: {x: 0, y: 0},
		leftButtonDown: false
	};

	function toPos(event) {
		//convert to local coordinates
		const rect = canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	}

	canvas.addEventListener('mousedown', function (event) {
		if(userControlled){
			mouse.pos = toPos(event);
			mouse.leftButtonDown = event.button === 0;
		}
	});
	canvas.addEventListener('mousemove', function (event) {
		if(userControlled){
			const pos = toPos(event);
			const delta = {
				x: mouse.pos.x - pos.x,
				y: invertedCamera ? mouse.pos.y - pos.y : pos.y - mouse.pos.y
			};
			if (mouse.leftButtonDown) {
				//add the relative movement of the mouse to the sollRotation variables
				camera.sollRotation.x = getDegrees(camera.sollRotation.x - delta.x);
				setSpotLightDirection();
				let ang = getDegrees(camera.sollRotation.y - delta.y);
				if (ang > 100 && ang < 260) {
					camera.sollRotation.y = ang;
				}
				//console.log("x: " + camera.sollRotation.x, "y: " + camera.sollRotation.y, "z: " + -Math.cos(deg2rad(camera.sollRotation.x)), "x: " + -Math.sin(deg2rad(camera.sollRotation.x)));
			}
			mouse.pos = pos;
		}
	});
	canvas.addEventListener('mouseup', function (event) {
		if(userControlled){
			mouse.pos = toPos(event);
			mouse.leftButtonDown = false;
		}
	});
	//register globally
	document.addEventListener('keypress', function (event) {
		//https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
		if ((event.code === 'KeyC') && (!userControlled)) {
			userControlled = true;
		}
		else if ((event.code === 'KeyN')&&(userControlled)) {
			toggleCubeMapTexture(activeSkybox === 0 ? 1 : 0);
		}
	});
	// map pressed keys
	document.addEventListener('keydown', function (event) {
		keyMap[event.code] = true;
	});
	// unmap pressed keys
	document.addEventListener('keyup', function (event) {
		keyMap[event.code] = false;
	});

	function getDegrees(angle) {
		angle = angle % 360;
		if (angle < 0) {
			angle += 360;
		}
		return angle;
	}

}

function moveUp() {
	move(0., 0., 1.);
}

function moveDown() {
	move(0., 0., -1.);
}

function moveForward() {
	let zpart = -Math.cos(deg2rad(camera.sollRotation.x));
	let xpart = Math.sin(deg2rad(camera.sollRotation.x));
	let ypart = -Math.sin(deg2rad(camera.sollRotation.y));
	move(zpart, xpart, ypart);
}

function moveBackwards() {
	let zpart = Math.cos(deg2rad(camera.sollRotation.x));
	let xpart = -Math.sin(deg2rad(camera.sollRotation.x));
	let ypart = Math.sin(deg2rad(camera.sollRotation.y));
	move(zpart, xpart, ypart);
}

function moveRight() {
	let zpart = Math.sin(deg2rad(camera.sollRotation.x));
	let xpart = Math.cos(deg2rad(camera.sollRotation.x));
	move(zpart, xpart, 0.);
}

function moveLeft() {
	let zpart = -Math.sin(deg2rad(camera.sollRotation.x));
	let xpart = -Math.cos(deg2rad(camera.sollRotation.x));
	move(zpart, xpart, 0.);
}

function move(zpart, xpart, ypart) {
	camera.sollPos.z = camera.sollPos.z + zoom * zpart;
	if (camera.sollPos.z > lookAtZ) {
		camera.sollPos.z = lookAtZ + 0.01;
	}
	camera.sollPos.x = camera.sollPos.x + zoom * xpart;
	camera.sollPos.y = camera.sollPos.y + zoom * ypart;
	//console.log("z :" + camera.sollPos.z, "x :" + camera.sollPos.x);
}

// advances the cameras ist position towards the soll position
function cameraControlLoop() {
	let c = 0.1;
	let r = 0.14;

	camera.istPos.x += diffValueController(camera.istPos.x, camera.sollPos.x, c);
	camera.istPos.y += diffValueController(camera.istPos.y, camera.sollPos.y, c);
	camera.istPos.z += diffValueController(camera.istPos.z, camera.sollPos.z, c);

	camera.istRotation.x += rotDiffValueController(camera.istRotation.x, camera.sollRotation.x, r);
	camera.istRotation.x = (camera.istRotation.x + 360) % 360;
	camera.istRotation.y += rotDiffValueController(camera.istRotation.y, camera.sollRotation.y, r);
	camera.istRotation.y = (camera.istRotation.y + 360) % 360;
}

// calcutes a simple linear difference between the src and dest value
function diffValueController(src, dest, k) {
	let diff = dest - src;

	// return scaled difference if the value exceeds the minimum error allowed
	if (Math.abs(diff) > 0.1) return diff * k;
	return 0;
}

// calcutes a simple linear difference between the src and dest value
// with respect to degree values which have the special property to overflow at 360 back to 0.
function rotDiffValueController(src, dest, k) {
	let diff = dest - src;

	if (Math.abs(diff) > 180) {
		// if we move through 0 or 360 the controller needs to pass this point too
		diff = (src > dest ? diff + 360 : diff - 360) % 360;
	}

	// return scaled difference if the value exceeds the minimum error allowed
	if (Math.abs(diff) > 1) return diff * k;
	return 0;
}

function sampleInputs() {
	if (userControlled) {
		//https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
		if (keyMap['ArrowUp'] || keyMap['KeyW']) {
			moveForward();
		}
		else if (keyMap['ArrowDown'] || keyMap['KeyS']) {
			moveBackwards();
		}
		if (keyMap['ArrowRight'] || keyMap['KeyD']) {
			moveRight();
		}
		else if (keyMap['ArrowLeft'] || keyMap['KeyA']) {
			moveLeft();
		}
		if (keyMap['KeyQ']) {
			moveUp();
		}
		else if (keyMap['KeyE']) {
			moveDown();
		}
	}
}
