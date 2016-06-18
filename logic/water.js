'use strict';

// water buffers
var reflectionFrameBuf;
var refractionFrameBuf;

var frameBufferWidth = 256;
var frameBufferHeight = 256;

const waterResolution = 4.0;

var reflectionColorTex;
var reflectionDepthBuf;

var refractionColorTex;
var refractionDepthBuf;

const waterHeight = -1;


function initRenderToTexture() {
	var depthTextureExt = gl.getExtension("WEBGL_depth_texture");
	if (!depthTextureExt) {
		alert('No depth texture support. Can not render water.');
		return;
	}

	frameBufferWidth = gl.drawingBufferWidth / waterResolution;
	frameBufferHeight = gl.drawingBufferHeight / waterResolution;

	//
	//
	//
	// REFLECTION
	// framebuffer + color buffer texture attachment + depth render buffer attachment

	//generate color texture (required mainly for debugging and to avoid bugs in some WebGL platforms)
	reflectionFrameBuf = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFrameBuf);

	// create color texture
	reflectionColorTex = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + reflectionColorTexUnit);
	gl.bindTexture(gl.TEXTURE_2D, reflectionColorTex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, frameBufferWidth, frameBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	// bind textures to framebuffer
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, reflectionColorTex, 0);

	// create depth buffer renderbuffer
	reflectionDepthBuf = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, reflectionDepthBuf);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, frameBufferWidth, frameBufferHeight);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, reflectionDepthBuf);

	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
		alert('Framebuffer incomplete. Can not render water.');
	}

	// clean up
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	//
	//
	//
	// REFRACTION
	// framebuffer + color buffer texture attachment + depth render buffer attachment

	//generate color texture (required mainly for debugging and to avoid bugs in some WebGL platforms)
	refractionFrameBuf = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, refractionFrameBuf);

	// create color texture
	refractionColorTex = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + refractionColorTexUnit);
	gl.bindTexture(gl.TEXTURE_2D, refractionColorTex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, frameBufferWidth, frameBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	// bind textures to framebuffer
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, refractionColorTex, 0);

	// create depth buffer renderbuffer
	refractionDepthBuf = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, refractionDepthBuf);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, frameBufferWidth, frameBufferHeight);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, refractionDepthBuf);

	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
		alert('Framebuffer incomplete. Can not render water.');
	}

	// clean up
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function updateFrameBufferSize()
{
	frameBufferWidth = gl.drawingBufferWidth / waterResolution;
	frameBufferHeight = gl.drawingBufferHeight / waterResolution;

	//
	//
	//
	// REFLECTION
	// framebuffer + color buffer texture attachment + depth render buffer attachment

	//generate color texture (required mainly for debugging and to avoid bugs in some WebGL platforms)
	gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFrameBuf);

	// create color texture
	gl.activeTexture(gl.TEXTURE0 + reflectionColorTexUnit);
	gl.bindTexture(gl.TEXTURE_2D, reflectionColorTex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, frameBufferWidth, frameBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	// bind textures to framebuffer
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, reflectionColorTex, 0);

	// create depth buffer renderbuffer
	gl.bindRenderbuffer(gl.RENDERBUFFER, reflectionDepthBuf);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, frameBufferWidth, frameBufferHeight);

	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
		alert('Framebuffer incomplete. Can not render water.');
	}

	// clean up
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	//
	//
	//
	// REFRACTION
	// framebuffer + color buffer texture attachment + depth render buffer attachment

	//generate color texture (required mainly for debugging and to avoid bugs in some WebGL platforms)
	gl.bindFramebuffer(gl.FRAMEBUFFER, refractionFrameBuf);

	// create color texture
	gl.activeTexture(gl.TEXTURE0 + refractionColorTexUnit);
	gl.bindTexture(gl.TEXTURE_2D, refractionColorTex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, frameBufferWidth, frameBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	// bind textures to framebuffer
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, refractionColorTex, 0);

	// create depth buffer renderbuffer
	gl.bindRenderbuffer(gl.RENDERBUFFER, refractionDepthBuf);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, frameBufferWidth, frameBufferHeight);

	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
		alert('Framebuffer incomplete. Can not render water.');
	}

	// clean up
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

//draw scene for shadow map
function renderWater(timeInMilliseconds, windowGotResized) {

	clippingNodes.forEach(function (c) { return c.enableClipping = 1; });

	// re-init
	if (windowGotResized) updateFrameBufferSize();

	renderRefraction(timeInMilliseconds);
	renderReflection(timeInMilliseconds);

	clippingNodes.forEach(function (c) { return c.enableClipping = 0; });
}

function renderReflection(timeInMilliseconds) {
	// clip everything underneath
	clippingNodes.forEach(function (c) { return c.clipPlane = vec2.fromValues(1.0, waterHeight); });

	//bind framebuffer to draw scene into texture
	gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFrameBuf);

	//setup viewport
	gl.viewport(0, 0, frameBufferWidth, frameBufferHeight);
	gl.clearColor(0.1, 0.1, 0.9, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//setup context and camera matrices
	const contextWater = createSGContext(gl);
	contextWater.projectionMatrix = mat4.perspective(mat4.create(), 30, frameBufferWidth / frameBufferHeight, 0.01, 130);
	//very primitive camera implementation
//  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
	let distanceToWater = camera.istPos.y - waterHeight;
	let lookAtMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(camera.istPos.x, camera.istPos.y - 2 * distanceToWater, camera.istPos.z),
		vec3.fromValues(camera.istPos.x, camera.istPos.y - 2 * distanceToWater, lookAtZ), vec3.fromValues(0, 1, 0));
	let mouseRotateMatrix = mat4.multiply(mat4.create(),
		glm.rotateX(-camera.istRotation.y),
		glm.rotateY(camera.istRotation.x));
//  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
	contextWater.viewMatrix = mat4.multiply(mat4.create(), mouseRotateMatrix, lookAtMatrix);

	// get inverse view matrix to allow computing eye-to-light matrix
	contextWater.invViewMatrix = mat4.invert(mat4.create(), contextWater.viewMatrix);

	//render scenegraph
	root.render(contextWater); //scene graph without floor to avoid reading from the same texture as we write to...
	rootTransparent.render(contextWater);

	// disable framebuffer (render to screen again)
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function renderRefraction(timeInMilliseconds) {
	// clip everything underneath
	clippingNodes.forEach(function (c) { return c.clipPlane = vec2.fromValues(-1.0, waterHeight); });
	//islandBodyNode.clipPlane = vec2.fromValues(-1.0, -100.0);

	//bind framebuffer to draw scene into texture
	gl.bindFramebuffer(gl.FRAMEBUFFER, refractionFrameBuf);

	//setup viewport
	gl.viewport(0, 0, frameBufferWidth, frameBufferHeight);
	gl.clearColor(0.1, 0.1, 0.9, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//setup context and camera matrices
	const contextWater = createSGContext(gl);
	contextWater.projectionMatrix = mat4.perspective(mat4.create(), 30, frameBufferWidth / frameBufferHeight, 0.01, 130);
	//very primitive camera implementation
//  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
	let lookAtMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(camera.istPos.x, camera.istPos.y, camera.istPos.z), vec3.fromValues(camera.istPos.x, camera.istPos.y, lookAtZ), vec3.fromValues(0, 1, 0));
	let mouseRotateMatrix = mat4.multiply(mat4.create(),
		glm.rotateX(camera.istRotation.y),
		glm.rotateY(camera.istRotation.x));
//  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
	contextWater.viewMatrix = mat4.multiply(mat4.create(), mouseRotateMatrix, lookAtMatrix);

	// get inverse view matrix to allow computing eye-to-light matrix
	contextWater.invViewMatrix = mat4.invert(mat4.create(), contextWater.viewMatrix);

	//render scenegraph
	root.render(contextWater); //scene graph without floor to avoid reading from the same texture as we write to...
	rootTransparent.render(contextWater);

	// disable framebuffer (render to screen again)
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}