'use strict';

// webgl main context
var gl = null;

// link to global resources
var resourcesGlobal = null;

// main scene graph nodes
var root = null;
var rootWater = null;
var rootTransparent = null;

// important node objects
var vehicleNode = null;
var pyramidNode = null;
var rockNode = null;
var crabNode = null;
var crystalNode = null;
var islandPlaneNode = null;
var islandBodyNode = null;
var waterShaderNode = null;

// light sources (rotation nodes)
var mainLightUp = null;
var mainLightDown = null;

// spot light source (only light node)
var spotLight = null;

var lastSampleTime = 0;

// load the resources
loadResources({

	// shader
	vs_single: 'shader/white.vs.glsl',
	fs_single: 'shader/white.fs.glsl',
	vs_phong: 'shader/phong.vs.glsl',
	fs_phong: 'shader/phong.fs.glsl',
	vs_cross: 'shader/cross.vs.glsl',
	fs_cross: 'shader/cross.fs.glsl',
	vs_billboard: 'shader/billboard.vs.glsl',
	fs_billboard: 'shader/billboard.fs.glsl',
	fs_tex3d: 'shader/texture3d.fs.glsl',
	vs_tex3d: 'shader/texture3d.vs.glsl',
	vs_texWater: 'shader/water.vs.glsl',
	fs_texWater: 'shader/water.fs.glsl',
	vs_skybox: 'shader/skybox.vs.glsl',
	fs_skybox: 'shader/skybox.fs.glsl',

	// models
	island_body: 'models/island/models/island_body.obj',
	island_plane: 'models/island/models/island_plane.obj',
	crystal: 'models/crystal/crystal.obj',
	crab: 'models/crab/crab.obj',
	rock: 'models/stone/models/stone.obj',
	cross: 'models/cross/cross.obj',

	// textures
	tex_tree: 'models/vegetation/tree.png',
	tex_grass: 'models/island/texture/grass.jpg',
	tex_dry: 'models/island/texture/dry.jpg',
	tex_rock: 'models/stone/texture/stone.jpg',
	tex_dudv: 'models/water/dudv.jpg',
	tex_test: 'models/test.jpg',

	// skybox
	env_night_pos_x: 'models/skybox/moon_rt_min.jpg',
	env_night_neg_x: 'models/skybox/moon_lf_min.jpg',
	env_night_pos_y: 'models/skybox/moon_up_min.jpg',
	env_night_neg_y: 'models/skybox/moon_dn_min.jpg',
	env_night_pos_z: 'models/skybox/moon_bk_min.jpg',
	env_night_neg_z: 'models/skybox/moon_ft_min.jpg',
	env_day_pos_x: 'models/skybox/tropical_rt_min.jpg',
	env_day_neg_x: 'models/skybox/tropical_lf_min.jpg',
	env_day_pos_y: 'models/skybox/tropical_up_min.jpg',
	env_day_neg_y: 'models/skybox/tropical_dn_min.jpg',
	env_day_pos_z: 'models/skybox/tropical_bk_min.jpg',
	env_day_neg_z: 'models/skybox/tropical_ft_min.jpg'

}).then(function (resources) {
	// start if the resources are loaded
	init(resources);
	render(0);
});

function init(resources) {

	// store resources reference and create webgl
	resourcesGlobal = resources;
	gl = createContext(400, 400);
	checkForWindowResize(gl);

	// initialize special buffers
	initSkybox(resources);
	initRenderToTexture();

	// enable depth testing
	gl.enable(gl.DEPTH_TEST);

	// create the scenegraph
	root = createSceneGraph(gl, resources);
	rootWater = createWaterSceneGraph(gl, resources);
	rootTransparent = createTransparentSceneGraph(gl,  resources);

	// setup interaction
	initInteraction(gl.canvas);
}

function createWaterSceneGraph(gl, resources) {
	waterShaderNode = new WaterTextureSGNode(reflectionColorTex, reflectionColorTexUnit, refractionColorTex, refractionColorTexUnit, resources.tex_dudv, [0, 0, 0], [new RenderSGNode(makeRect(9.4, 8.9))]);
	//let localRoot = new ShaderSGNode(createProgram(gl, resources.vs_phong, resources.fs_phong));
	let waterDemo = new ShaderSGNode(createProgram(gl, resources.vs_texWater, resources.fs_texWater), [waterShaderNode]);
	//localRoot.append(waterTransform);
	return new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({
		translate: [-2.2, waterHeight, -2.2],
		rotateX: 90,
		rotateZ: 40,
		scale: 1.0
	}), [waterDemo])]);

}

function createTransparentSceneGraph(gl, resources) {

	let transparentRoot = new TransformationSGNode(mat4.create());

	function createBillboard(gl, resources, x, y, z)
	{
		let materialNode = new MaterialSGNode([new NiceTextureSGNode(resources.tex_tree, 1.0, [new RenderSGNode(makeBillboard(2.0, 2.0))])]);
		materialNode.specular = [0.1, 0.2, 0.15, 0.];
		materialNode.shininess = 0.5;
		return new ShaderSGNode(createProgram(gl, resources.vs_billboard, resources.fs_billboard), [new TransformationSGNode(glm.transform({
			translate: [x, y, z],
			scale: 0.75,
			rotateX: 0,
			rotateZ: 0
		}), [materialNode])]);
	}

	for (var i = 0; i < 3; i++) {
		let billboard = createBillboard(gl, resources, 6 - i * 6, 1.5, 15);
		billboard.append(spotLight);
		billboard.append(mainLightUp);
		transparentRoot.append(billboard);
	}

	return transparentRoot;
}

function createSceneGraph(gl, resources) {

	// phong shader as root
	const root = new ShaderSGNode(createProgram(gl, resources.vs_phong, resources.fs_phong));

	//add skybox by putting large sphere around us
	var skybox = new ShaderSGNode(createProgram(gl, resources.vs_skybox, resources.fs_skybox), [new SkyboxSGNode(envcubetexture, 4,
		new RenderSGNode(makeSphere(50)))]);
	root.append(skybox);

	// y axis of light source does not work as expected somehow
	mainLightUp = makeLight(gl, resources, 0, 10, 0);
	mainLightDown = makeLight(gl, resources, 10, -20, 10);

	// main light sources
	root.append(mainLightUp);  // upper light

	pyramidNode = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({
		translate: [0, 0, 0.5],
		scale: 1
	}), [new RenderSGNode(makePyramid())])]);
	let vehicle = new MaterialSGNode([
		new RenderSGNode(makeVehicle()),
		pyramidNode
	]);
	vehicle.ambient = [0.24725, 0.1995, 0.2745, 1];
	vehicle.diffuse = [0.75164, 0.60648, 0.42648, 1];
	vehicle.specular = [0.628281, 0.555802, 0.666065, 1];
	vehicle.shininess = 0.4;

	let spLight = makeSpotLight(gl, resources, 0, -0.5, 0.25);

	vehicleNode = //new TransformationSGNode(mat4.create(), [
		new TransformationSGNode(glm.transform({
			translate: [vehicleData.isPos.x, vehicleData.isPos.y, vehicleData.isPos.z],
			rotateX: vehicleData.rotation.x,
			rotateZ: vehicleData.rotation.z,
			rotateY: vehicleData.rotation.y
		}), [
			vehicle, spLight
			//  ])
		]);
	root.append(vehicleNode);
	root.append(spotLight);


	islandPlaneNode = new NiceTextureSGNode(resources.tex_grass, 0.2, [new RenderSGNode(resources.island_plane)]);
	let islandPlane = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d), [new MaterialSGNode([islandPlaneNode])]);
	islandPlane.ambient = [0, 0.3, 0, 1];
	islandPlane.diffuse = [0.52, 0.86, 0.12, 1];
	islandPlane.specular = [0.1, 0.2, 0.15, 0.];
	islandPlane.shininess = 1.0;
	islandPlane.append(mainLightUp);
	islandPlane.append(spotLight);
	let rotateIslandPlane = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({
		translate: [0, 0, 0],
		scale: 1.0
	}), [islandPlane])]);
	root.append(rotateIslandPlane);

	// lower part of the island
	islandBodyNode = new NiceTextureSGNode(resources.tex_dry, 0.05, [new RenderSGNode(resources.island_body)]);
	let islandBody = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d), [new MaterialSGNode([islandBodyNode])]);
	islandBody.ambient = [0, 0.3, 0, 1];
	islandBody.diffuse = [0.52, 0.86, 0.12, 1];
	islandBody.specular = [0.1, 0.2, 0.15, 0.];
	islandBody.shininess = 1.0;
	islandBody.append(mainLightDown);
	let rotateIslandBody = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({
		translate: [0, 0, 0],
		scale: 1.0
	}), [islandBody])]);
	root.append(rotateIslandBody);

	// coordinate cross for debugging
	let coordinateCross = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({
		translate: [0, 0, 0],
		scale: 0.05
	}), [new ShaderSGNode(createProgram(gl, resources.vs_cross, resources.fs_cross), [new RenderSGNode(resources.cross)])])]);
	root.append(coordinateCross);

	let rockMaterialNode = new MaterialSGNode([new NiceTextureSGNode(resources.tex_rock, 0.2, [new RenderSGNode(resources.rock)])]);
	rockMaterialNode.ambient = [0, 0.3, 0, 1];
	rockMaterialNode.diffuse = [0.2, 0.2, 0.2, 1];
	rockMaterialNode.specular = [0.1, 0.1, 0.1, 0.];
	rockMaterialNode.shininess = 0.5;
	let rockShaderNode = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d), [new TransformationSGNode(glm.transform({
		translate: [rock.pos.x, rock.pos.y, rock.pos.z],
		scale: 1,
		rotateY: 0,
		rotateZ: 0
	}), [rockMaterialNode])]);
	rockShaderNode.append(spotLight);
	rockShaderNode.append(mainLightUp);
	rockNode = new TransformationSGNode(mat4.create(), [rockShaderNode]);
	root.append(rockNode);
	let crab = new MaterialSGNode([new RenderSGNode(resources.crab)]);
	crab.ambient = [1, 0.1995, 0.2745, 1];
	crab.diffuse = [1, 0.60648, 0.42648, 1];
	crab.specular = [1, 0.555802, 0.666065, 1];
	crab.shininess = 0.5;
	crabNode = new TransformationSGNode(glm.transform({
		translate: [-2, 0, 0],
		rotateY: 90
	}), [new TransformationSGNode(glm.transform({translate: [0, 0, 2], rotateY: 270}), [
		crab])
	]);
	root.append(new TransformationSGNode(glm.transform({
		translate: [rock.pos.x, 0, rock.pos.z],
		rotateY: 270
	}), [crabNode]));
	let crystal = new MaterialSGNode([new RenderSGNode(resources.crystal)]);
	crystal.ambient = [1, 1, 0.8, 1];
	crystal.diffuse = [1, 1, 0.8, 1];
	crystal.specular = [1, 1, 0.8, 1];
	crystal.shininess = 0.5;
	crystalNode = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({
		translate: [0, 0, 2 / 0.025],
		rotateX: 90
	}), [
		crystal])
	]);
	root.append(new TransformationSGNode(glm.transform({
		translate: [crystalData.pos.x, crystalData.pos.y, crystalData.pos.z],
		scale: 0.025
	}), crystalNode));

	return root;
}

function makeLight(gl, resources, x, y, z) {
	function createLightSphere() {
		return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [new RenderSGNode(makeSphere(.2, 10, 10))]);
	}

	let light = new LightSGNode();
	light.ambient = [0.1, 0.1, 0.1, 1];
	light.diffuse = [0.15, 0.15, 0.15, 1];
	light.specular = [0, 0, 0, 1];
	light.position = [0, 0, 0];
	/*
	 light.ambient = [0.2, 0.2, 0.2, 1];
	 light.diffuse = [0.8, 0.8, 0.8, 1];
	 light.specular = [1, 1, 1, 1];*/

	let rotateLight = new TransformationSGNode(mat4.create());
	let translateLight = new TransformationSGNode(glm.translate(x, y, z)); //translating the light is the same as setting the light position

	rotateLight.append(translateLight);
	translateLight.append(light);
	translateLight.append(createLightSphere());

	return rotateLight;
}

function makeSpotLight(gl, resources, x, y, z) {
	function createLightSphere() {
		return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [new RenderSGNode(makeSphere(.2, 10, 10))]);
	}

	spotLight = new SpotLightSGNode();
	spotLight.ambient = [0, 0, 0, 1];
	spotLight.diffuse = [0, 0, 0, 1];
	spotLight.specular = [0, 0, 0, 1];
	spotLight.position = [0, 0, 0];
	setSpotLightDirection();

	let translateLight = new TransformationSGNode(glm.translate(x, y, z)); //translating the light is the same as setting the light position

	translateLight.append(createLightSphere());

	return translateLight;
}

function setSpotLightDirection() {
	spotLight.direction = [-Math.sin(deg2rad(camera.sollRotation.x + vehicleData.rotation.z - 180)), 0, Math.cos(deg2rad(camera.sollRotation.x + vehicleData.rotation.z - 180))];
}

function makeVehicle() {
	var position = [-0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.25, -0.5, 0.5, 0.25, -0.5, 0.5, -0.5, 0.5, 0.0,
		0.5, 0.5, 0.0, -0.25, -0.5, 0.0, 0.25, -0.5, 0.0];
	var normal = [-1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1];
	var texturecoordinates = [0, 0, 5, 0, 5, 5, 0, 5, 5, 0, 5, 5, 0, 0, 0, 0];
	var index = [0, 1, 2, 1, 2, 3, 4, 5, 6, 5, 6, 7, 0, 1, 4, 1, 4, 5, 0, 2, 4, 2, 4, 6, 2, 3, 6, 3, 6, 7, 1, 3, 5, 3, 5, 7];
	return {
		position: position,
		normal: normal,
		texture: texturecoordinates,
		index: index
	};
}

function makePyramid() {
	var position = [0, 0, 0.3, 0, 0.3, 0, -0.3, -0.3, 0, 0.3, -0.3, 0];
	var normal = [0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1];
	var index = [0, 1, 2, 0, 2, 3, 0, 3, 1];
	return {
		position: position,
		normal: null,
		texture: null,
		index: index
	};
}

function makeBillboard(width, height) {
	var position = [-width, -height, 0, width, -height, 0, width, height, 0, -width, height, 0,];
	var normal = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
	var texturecoordinates = [1, 1, 0, 1, 0, 0, 1, 0];
	var index = [0, 1, 2, 2, 3, 0];
	return {
		position: position,
		normal: normal,
		texture: texturecoordinates,
		index: index
	};
}

function render(timeInMilliseconds) {
	checkForWindowResize(gl);

	// update animations
	renderAnimations(timeInMilliseconds);

	// check input
	renderInput(timeInMilliseconds);

	// render water textures
	renderWater(timeInMilliseconds);

	// render opaque and transparent objects
	renderScene(timeInMilliseconds);

	// trace and next frame
	measureFps();
	requestAnimationFrame(render);
}

function renderScene(timeInMilliseconds) {

	//setup viewport
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	gl.clearColor(0.0, 1.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// correct blending (https://limnu.com/webgl-blending-youre-probably-wrong/)
	gl.enable(gl.BLEND);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	//setup context and camera matrices
	const context = createSGContext(gl);
	context.projectionMatrix = mat4.perspective(mat4.create(), 30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
	//very primitive camera implementation
	let lookAtMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(camera.istPos.x, camera.istPos.y, camera.istPos.z), vec3.fromValues(camera.istPos.x, camera.istPos.y, lookAtZ), vec3.fromValues(0, 1, 0));
	let mouseRotateMatrix = mat4.multiply(mat4.create(),
		glm.rotateX(camera.istRotation.y),
		glm.rotateY(camera.istRotation.x));
	context.viewMatrix = mat4.multiply(mat4.create(), mouseRotateMatrix, lookAtMatrix);

	context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

	// render water > opaque > transparent
	rootWater.render(context);
	root.render(context);
	rootTransparent.render(context);

}

function renderInput(timeInMilliseconds) {
	// advance camera position
	cameraControlLoop();

	// sample mouse and keyboard input every 10 milliseconds
	if ((timeInMilliseconds - lastSampleTime) > 10) {
		sampleInputs();
		lastSampleTime = timeInMilliseconds;
	}
}