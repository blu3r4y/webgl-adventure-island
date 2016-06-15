'use strict';

var nextPos = -1;
var vehiclePositions = [[10, 0.5, -8], [10, 0.5, 1], [1, 0.5, 5]];

const vehicleData = {
	isPos: {
		x: 2,
		y: -2,
		z: -8
	},
	destPos: {
		x: 2,
		y: 0.5,
		z: -8
	},
	rotation: {
		x: 90,
		y: 180,
		z: 270
	},
	animation: false
};

const rock = {
	pos: {
		x: 10,
		y: 0,
		z: 4
	}
};

var animationTime = 0;
var animateRock = false;
var animationRockStart;

var animateCrab = false;
var animationCrabStart;

var animateCrystal = false;

const crystalData = {
	pos: {
		x: -2,
		y: 0,
		z: 5
	}
};

var state = 0;


var lastStateTime = 0;

function renderAnimations(timeInMilliseconds)
{
	var vehicleDone;
	let rotationFactor = 0.1;
	let circles = 3;

	if (vehicleData.animation) {
		vehicleDone = vehicleControlLoop();
		if (vehicleDone) {
			nextPos++;
			if (nextPos < vehiclePositions.length) {
				vehicleData.destPos.x = vehiclePositions[nextPos][0];
				vehicleData.destPos.y = vehiclePositions[nextPos][1];
				vehicleData.destPos.z = vehiclePositions[nextPos][2];
			}
			vehicleData.animation = false;
		}
	}

	if (!userControlled) {//only show the movie when not in user-mode
		switch (state) {
			case 0: //First camera flight
				if (camera.istPos.z < -17) {
					moveForward();
				}
				else {
					state++;
					lastStateTime = timeInMilliseconds;
				}
				break;
			case 1://Vehicle rises from water
				if (timeInMilliseconds - lastStateTime > 1000) {
					vehicleData.animation = true;
				}
				if (vehicleDone) {
					state++;
					lastStateTime = timeInMilliseconds;
					spotLight.ambient = [0.1, 0.1, 0.1, 1];
					spotLight.diffuse = [1, 1, 1, 1];
					spotLight.specular = [1, 1, 1, 1];
					vehicleData.animation = false;
				}
				break;
			case 2:
				if (timeInMilliseconds - lastStateTime > 500) {
					vehicleData.animation = true;
				}
				if (vehicleDone) {
					camera.sollPos.x = vehicleData.isPos.x;
					state++;
					lastStateTime = timeInMilliseconds;
					vehicleData.animation = false;
				}
				break;
			case 3:
				if (vehicleData.rotation.z > 180) {
					vehicleData.rotation.z -= 1;
				}
				else {
					state++;
					lastStateTime = timeInMilliseconds;
				}
				break;
			case 4:
				vehicleData.animation = true;
				followVehicle(5);
				if (vehicleDone) {
					state++;
					lastStateTime = timeInMilliseconds;
					vehicleData.animation = false;
				}
				break;
			case 5:
				if (timeInMilliseconds - lastStateTime > 1500) {
					followVehicle(7);
					state++;
					lastStateTime = timeInMilliseconds;
				}
				break;
			case 6:
				if (timeInMilliseconds - animationCrabStart > 360 / rotationFactor * circles) {
					state++;
				}
				break;
			case 7:
				if (vehicleData.rotation.z > 135) {
					vehicleData.rotation.z -= 1;
				}
				else {
					state++;
					lastStateTime = timeInMilliseconds;
					camera.sollRotation.x = 225;
					camera.sollPos.x = 14.5;
					camera.sollPos.z = -4.5;
				}
				break;
			case 8:
				vehicleData.animation = true;
				followVehicle(5);
				if (vehicleDone) {
					state++;
					vehicleData.animation = false;
					lastStateTime = timeInMilliseconds;
				}
				break;
			case 9:
				if (timeInMilliseconds - lastStateTime > 500) {
					followVehicle(7);
					state++;
					lastStateTime = timeInMilliseconds;
				}
				break;
			default: //We're done with the movie, swith to user mode
				userControlled = true;
				console.log("Time elapsed: " + timeInMilliseconds);
				console.log("x" + camera.sollPos.x, "y" + camera.sollPos.y, "z" + camera.sollPos.z);
				break;
		}
	}

	//check whether camera is close enough to toggle stone animation
	if (!animateRock && !animateCrab) {
		if (isInsideCircle(rock.pos.x, rock.pos.z, camera.sollPos.x, camera.sollPos.z, 9)) {
			animateRock = true;
			animationRockStart = timeInMilliseconds;
		}
	}
	//check whether the rock animation should stop and the crab animation should start
	if (animateRock && ((timeInMilliseconds - animationRockStart) > 1000)) {
		animateRock = false;
		animateCrab = true;
		animationCrabStart = timeInMilliseconds;
	}
	//check whether the crab animation should stop (after 3 circles))
	if (animateCrab && (timeInMilliseconds - animationCrabStart) > 360 / rotationFactor * circles) {
		animateCrab = false;
		crabNode.matrix = glm.transform({translate: [-2, 0, 0], rotateY: 90});
	}
	//check whether the crystal animation should start
	if (!animateCrystal && crystalData.pos.y == 0) {
		if (isInsideCircle(crystalData.pos.x, crystalData.pos.z, camera.sollPos.x, camera.sollPos.z, 8)) {
			animateCrystal = true;
		}
	}

	// rotate lower light just for fun
	mainLightDown.matrix = glm.rotateY(timeInMilliseconds * 0.2);

	// animate water
	waterShaderNode.waveOffset += 0.0002;
	waterShaderNode.waveOffset %= 1.0;
	// set camera pos for water fresel effect
	waterShaderNode.camera = [camera.istPos.x, camera.istPos.y, camera.istPos.z];

	//Animate pyramid always
	pyramidNode.matrix = glm.rotateZ(timeInMilliseconds * -0.01);
	// Animate rock every 100 ms
	if (animateRock && ((timeInMilliseconds - animationTime) > 100)) {
		//Alternate between 0 and 1
		rock.pos.y = (rock.pos.y + 1) & 1;
		rockNode.matrix = glm.transform({translate: [0, rock.pos.y * 0.1, 0]});
		animationTime = timeInMilliseconds;
	}
	if (animateCrab) {
		crabNode.matrix = glm.rotateY(90 + (timeInMilliseconds - animationCrabStart) * -rotationFactor);
	}
	if (animateCrystal) {
		crystalNode.matrix = glm.transform({
			translate: [0, crystalData.pos.y++, 0],
			rotateY: 270 + timeInMilliseconds * -rotationFactor
		});
		if (crystalData.pos.y > 10 / 0.025) {
			animateCrystal = false;
		}
	}
	//vehicleData.rotation.z = timeInMilliseconds*-rotationFactor;
	vehicleNode.matrix = glm.transform({
		translate: [vehicleData.isPos.x, vehicleData.isPos.y, vehicleData.isPos.z],
		rotateZ: vehicleData.rotation.z,
		rotateX: vehicleData.rotation.x,
		rotateY: vehicleData.rotation.y
	});
	spotLight.position = [vehicleData.isPos.x, vehicleData.isPos.y, vehicleData.isPos.z];
	setSpotLightDirection();
}

//lets the camera follow the vehicle from behind with the given distance
function followVehicle(distance) {
	let zpart = -Math.cos(deg2rad(camera.sollRotation.x));
	let xpart = Math.sin(deg2rad(camera.sollRotation.x));
	camera.sollPos.x = vehicleData.isPos.x - distance * xpart;
	camera.sollPos.z = vehicleData.isPos.z - distance * zpart;
}

function vehicleControlLoop() {
	let c = 0.05;

	let x = diffValueController(vehicleData.isPos.x, vehicleData.destPos.x, c);
	let y = diffValueController(vehicleData.isPos.y, vehicleData.destPos.y, c);
	let z = diffValueController(vehicleData.isPos.z, vehicleData.destPos.z, c);

	vehicleData.isPos.x += x;
	vehicleData.isPos.y += y;
	vehicleData.isPos.z += z;
	//console.log("Vehicle: x: " + vehicleData.isPos.x, "z: " + vehicleData.isPos.z);
	return ((x == 0) && (y == 0) && (z == 0));

}