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
var crystalHeight = 16;

const crystalData = {
	pos: {
		x: -2,
		y: 0,
		z: 5
	}
};

var state = 0;


var lastStateTime = 0;

function renderAnimations(timeInMilliseconds, deltaInMilliseonds)
{
	let rotationFactor = 0.1;
	//Determines how many time the crab walks around the stone
	let circles = 3;

	switch (state) {
		case 0: //First camera flight
			if (!userControlled && camera.istPos.z < -17) {
				moveForward(20);
			}
			if(timeInMilliseconds > 5000) {
				state++;
				lastStateTime = timeInMilliseconds;
			}
			break;
		case 1://Vehicle rises from water
			if(timeInMilliseconds - lastStateTime < 1500){
				moveVehicle(lastStateTime + 1500 - timeInMilliseconds)
			}
			else{
				state++;
				lastStateTime = timeInMilliseconds;
				spotLight.light.ambient = [0.1, 0.1, 0.1, 1];
				spotLight.light.diffuse = [1, 1, 1, 1];
				spotLight.light.specular = [1, 1, 1, 1];
				nextPos++;
				if (nextPos < vehiclePositions.length) {
					vehicleData.destPos.x = vehiclePositions[nextPos][0];
					vehicleData.destPos.y = vehiclePositions[nextPos][1];
					vehicleData.destPos.z = vehiclePositions[nextPos][2];
				}
			}
			break;
		case 2://vehicle moves to the left
			if(timeInMilliseconds - lastStateTime < 2000){
				moveVehicle(lastStateTime + 2000 - timeInMilliseconds)
			}
			else{
				state++;
				lastStateTime = timeInMilliseconds;
				nextPos++;
				if (nextPos < vehiclePositions.length) {
					vehicleData.destPos.x = vehiclePositions[nextPos][0];
					vehicleData.destPos.y = vehiclePositions[nextPos][1];
					vehicleData.destPos.z = vehiclePositions[nextPos][2];
				}
			}
			break;
		case 3://vehicle  rotates
			if (vehicleData.rotation.z > 180) {
				vehicleData.rotation.z -= 1;
			}
			if(timeInMilliseconds - lastStateTime > 3000){
				state++;
				lastStateTime = timeInMilliseconds;
			}
			break;
		case 4://vehicle moves forward to the stone
			if(!userControlled) followVehicle(5);
			if(timeInMilliseconds - lastStateTime < 2500){
				moveVehicle(lastStateTime + 2500 - timeInMilliseconds)
			}
			else{
				state++;
				lastStateTime = timeInMilliseconds;
				nextPos++;
				if (nextPos < vehiclePositions.length) {
					vehicleData.destPos.x = vehiclePositions[nextPos][0];
					vehicleData.destPos.y = vehiclePositions[nextPos][1];
					vehicleData.destPos.z = vehiclePositions[nextPos][2];
				}
			}
			break;
		case 5://camera "jumps" back
			if (timeInMilliseconds - lastStateTime > 1500) {
				if(!userControlled) followVehicle(7);
				state++;
				lastStateTime = timeInMilliseconds;
			}
			break;
		case 6://vehicle stares at crab
			if (timeInMilliseconds - lastStateTime > 5000) {
				state++;
				lastStateTime = timeInMilliseconds;
			}
			break;
		case 7://vehicle rotates and camera follows
			if (vehicleData.rotation.z > 135) {
				vehicleData.rotation.z -= 1;
			}
			if(timeInMilliseconds - lastStateTime > 1500){
				state++;
				lastStateTime = timeInMilliseconds;
				if(!userControlled){
					camera.sollRotation.x = 225;
					camera.sollPos.x = 14.5;
					camera.sollPos.z = -4.5;
				}
			}
			break;
		case 8://vehicle moves to crystal and camera follows
			if(!userControlled) followVehicle(5);
			if(timeInMilliseconds - lastStateTime < 2500){
				moveVehicle(lastStateTime + 2500 - timeInMilliseconds)
			}
			else{
				state++;
				lastStateTime = timeInMilliseconds;
				nextPos++;
				if (nextPos < vehiclePositions.length) {
					vehicleData.destPos.x = vehiclePositions[nextPos][0];
					vehicleData.destPos.y = vehiclePositions[nextPos][1];
					vehicleData.destPos.z = vehiclePositions[nextPos][2];
				}
			}
			break;
		case 9://camera moves backwards
			if (timeInMilliseconds - lastStateTime > 500) {
				if(!userControlled) followVehicle(7);
				state++;
				lastStateTime = timeInMilliseconds;
			}
			break;
		case 10://when the crystal reaches a certain height, the vehicle turns its light off
			if(crystalData.pos.y > (crystalHeight/4) / crystalScale){
				spotLight.light.ambient = [0, 0, 0, 1];
				spotLight.light.diffuse = [0, 0, 0, 1];
				spotLight.light.specular = [0, 0, 0, 1];
				if(!userControlled) followVehicle(14);
				state++;
				lastStateTime = timeInMilliseconds;
			}
			break;
		case 11://time is over - if the crystal is still rising, stop it
			if(timeInMilliseconds > 30000){
				state++;
				lastStateTime = timeInMilliseconds;
				if(animateCrystal) {
					animateCrystal = false;
					crystalLight.light.ambient = [0.5, 0.5, 0.5, 1];
					toggleCubeMapTexture(activeSkybox === 0 ? 1 : 0);
				}
			}
			break;
		case 12:	//We're done with the movie, swith to user mode
			userControlled = true;
			console.log("Time elapsed: " + timeInMilliseconds);
			//console.log("x: " + camera.sollPos.x, "y: " + camera.sollPos.y, "z: " + camera.sollPos.z);
			state++;
			break;
		default:
			break;
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
	mainLightDown.node.matrix = glm.rotateY(timeInMilliseconds * 0.2);

	// animate water
	waterShaderNode.waveOffset += 0.0002;
	waterShaderNode.waveOffset %= 1.0;
	// set camera pos for water fresel effect
	waterShaderNode.camera = [camera.istPos.x, camera.istPos.y, camera.istPos.z];

	//Animate pyramid always
	pyramidNode.matrix = glm.rotateZ(timeInMilliseconds * -rotationFactor);
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
		crystalLight.node.matrix = glm.transform({
			translate: [0, crystalData.pos.y++, 0],
			rotateY: 270 + timeInMilliseconds * -rotationFactor
		});
		if(crystalLight.light.diffuse[0] < 0.7){
			crystalLight.light.diffuse[0] += 0.1;
			crystalLight.light.diffuse[1] += 0.1;
			crystalLight.light.diffuse[2] += 0.1;
		}
		if(crystalLight.light.specular[0] < 0.8){
			crystalLight.light.specular[0] += 0.1;
			crystalLight.light.specular[1] += 0.1;
			crystalLight.light.specular[2] += 0.1;
		}
		if (crystalData.pos.y > crystalHeight / crystalScale) {
			animateCrystal = false;
			crystalLight.light.ambient = [0.5, 0.5, 0.5, 1];
			toggleCubeMapTexture(activeSkybox === 0 ? 1 : 0);
		}
	}
	vehicleNode.matrix = glm.transform({
		translate: [vehicleData.isPos.x, vehicleData.isPos.y, vehicleData.isPos.z],
		rotateZ: vehicleData.rotation.z,
		rotateX: vehicleData.rotation.x,
		rotateY: vehicleData.rotation.y
	});
	spotLight.light.position = [vehicleData.isPos.x, vehicleData.isPos.y, vehicleData.isPos.z];
	setSpotLightDirection();
}

//lets the camera follow the vehicle from behind with the given distance
function followVehicle(distance) {
	let zpart = -Math.cos(deg2rad(camera.sollRotation.x));
	let xpart = Math.sin(deg2rad(camera.sollRotation.x));
	camera.sollPos.x = vehicleData.isPos.x - distance * xpart;
	camera.sollPos.z = vehicleData.isPos.z - distance * zpart;
}

function moveVehicle(remainingTime) {

	//console.log(remainingTime);

	let x = vehicleData.destPos.x - vehicleData.isPos.x;
	let y = vehicleData.destPos.y - vehicleData.isPos.y;
	let z = vehicleData.destPos.z - vehicleData.isPos.z;

	let deltaX = Math.abs(x / remainingTime);
	let deltaY = Math.abs(y / remainingTime);
	let deltaZ = Math.abs(z / remainingTime);

	if(deltaX > 0 && deltaX < 0.05){
		deltaX = 0.05;
	}
	if(deltaY > 0 && deltaY < 0.05){
		deltaY = 0.05;
	}
	if(deltaZ > 0 && deltaZ < 0.05){
		deltaZ = 0.05;
	}

	vehicleData.isPos.x += diffValueController(vehicleData.isPos.x, vehicleData.destPos.x, deltaX);
	vehicleData.isPos.y += diffValueController(vehicleData.isPos.y, vehicleData.destPos.y, deltaY);
	vehicleData.isPos.z += diffValueController(vehicleData.isPos.z, vehicleData.destPos.z, deltaZ);
	//console.log("Vehicle: x: " + vehicleData.isPos.x, "z: " + vehicleData.isPos.z);

}
