'use strict';

// fps measurement - taken from http://stackoverflow.com/a/16432859
var elapsedTime = 0;
var frameCount = 0;
var lastTime = new Date().getTime();

function deg2rad(degrees) {
	return degrees * Math.PI / 180;
}

function isInsideCircle(circleX, circleZ, x, z, radius) {
	let dx = circleX - x;
	let dz = circleZ - z;
	let radiusSq = radius * radius;
	let distSq = dx * dx + dz * dz;
	return distSq <= radiusSq;
}

function hasWindowResized(gl) {
	// remember current buffer sizes
	var width = gl.drawingBufferWidth;
	var height = gl.drawingBufferHeight;

	// refresh them
	checkForWindowResize(gl);

	// return if the changed
	return (gl.drawingBufferWidth != width ||
		gl.drawingBufferHeight != height);
}

// fps measurement - taken from http://stackoverflow.com/a/16432859
function measureFps() {
	var now = new Date().getTime();

	frameCount++;
	elapsedTime += (now - lastTime);

	lastTime = now;

	if (elapsedTime >= 1000) {
		let fps = frameCount;
		frameCount = 0;
		elapsedTime -= 1000;

		//console.log(fps + " fps");
	}
}
