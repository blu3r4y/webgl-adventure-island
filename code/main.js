'use strict';

/**
 * holds object properties (e.g. a LightNode with light parameters)
 * along with its transformation nodes (e.g. TransformationNode for scaling, positioning, etc.)
 */
class LightTransformationPair {
	constructor(light, node) {
		this.light = light;
		this.node = node;
	}
}

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
var clippingNodes = [];

// light sources (light nodes and transformation node)
var mainLightDown = new LightTransformationPair();
var spotLight = new LightTransformationPair();
var crystalLight = new LightTransformationPair();

// important texture units
const skyboxTexUnit = 2;
const reflectionColorTexUnit = 3;
const refractionColorTexUnit = 4;

// other constants
const crystalScale = 0.025;
var lastSampleTime = 0;
var lastTimeInMilliseconds = 0;

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
	tex_grassBill: 'models/vegetation/grass.png',
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
	rootTransparent = createTransparentSceneGraph(gl, resources);

	// setup interaction
	initInteraction(gl.canvas);

	// make it day immediatly - debug
	//userControlled = true;
	//animateCrystal = true; userControlled = true;
}

function createWaterSceneGraph(gl, resources) {
	waterShaderNode = new WaterTextureSGNode(reflectionColorTex, reflectionColorTexUnit, refractionColorTex, refractionColorTexUnit,
		resources.tex_dudv, [0, 0, 0],
		new RenderSGNode(makeRect(9.4, 8.9)));

	return new TransformationSGNode(mat4.create(),
		new TransformationSGNode(glm.transform({translate: [-2.2, waterHeight, -2.2], rotateX: 90, rotateZ: 40, scale: 1.0}),
			new ShaderSGNode(createProgram(gl, resources.vs_texWater, resources.fs_texWater),
				waterShaderNode)));
}

function createTransparentSceneGraph(gl, resources) {

	let transparentRoot = new TransparencySGNode();

	function createBillboard(gl, resources, x, y, z, scale, resource) {
		let materialNode = new MaterialSGNode(
			new NiceTextureSGNode(resource, 1.0,
				new TransparentRenderSGNode(makeBillboardRenderObject(2.0, 2.0))));

		materialNode.specular = [0.1, 0.2, 0.15, 0.];
		materialNode.shininess = 0.5;

		return new ShaderSGNode(createProgram(gl, resources.vs_billboard, resources.fs_billboard),
			new TransformationSGNode(glm.transform({translate: [x, y, z], scale: scale, rotateX: 0, rotateZ: 0}),
				materialNode));
	}

	for (var i = 0; i < 3; i++) {
		let billboard = createBillboard(gl, resources, 6 - i * 6, 1.5, 15, 0.75, resources.tex_tree);
		billboard.append(spotLight.light);
		billboard.append(crystalLight.light);
		transparentRoot.append(billboard);
	}

	for (var j = 0; j < 3; j++) {
		let billboard = createBillboard(gl, resources, 12 - j * 0.5, 1.5, 0 - j * 3.0, 0.8, resources.tex_grassBill);
		billboard.append(spotLight.light);
		billboard.append(crystalLight.light);
		transparentRoot.append(billboard);
	}

	return transparentRoot;
}

function createSceneGraph(gl, resources) {

	// root for all objects
	let objectRoot = new SGNode();

	// global phong shader and clipping capability
	let clipNode = new ClippingSGNode(null, objectRoot);
	let root = new ShaderSGNode(createProgram(gl, resources.vs_phong, resources.fs_phong),
		clipNode);
	clippingNodes.push(clipNode);

	// add skybox by putting large sphere around us
	let skybox = new ShaderSGNode(createProgram(gl, resources.vs_skybox, resources.fs_skybox),
		new SkyboxSGNode(skyboxTextureId, skyboxTexUnit,
			new RenderSGNode(makeSphere(60))));
	objectRoot.append(skybox);

	/** LIGHT SOURCES */

	// crystal light
	crystalLight = makeCrystalLight(gl, resources);
	objectRoot.append(crystalLight.node);

	// lower light (with light sphere)
	mainLightDown = makeLightDownWithSphere(gl, resources, 10, -20, 10);

	// vehicle spot light
	spotLight = makeSpotLightWithSphere(gl, resources, 0, -0.5, 0.25);
	setSpotLightDirection();

	/** OBJECTS */

	// island
	let islandNode = makeIslandPlane(gl, resources);
	islandNode.append(spotLight.light);
	objectRoot.append(islandNode);
	objectRoot.append(makeIslandBody(gl, resources));

	// crystal
	islandNode.append(makeCrystal(gl, resources));

	// coordinate cross for debugging
	//islandNode.append(makeCoordinateCross(gl,  resources));

	// vehicle
	vehicleNode = makeVehicle(gl, resources);
	islandNode.append(vehicleNode);
	//islandNode.append(spotLight.light);

	// rock
	rockNode = makeRock(gl, resources);
	islandNode.append(rockNode);

	// crab
	islandNode.append(makeCrab(gl,  resources));

	return root;
}

/**
 * light scene graph elements
 */

function makeLightDownWithSphere(gl, resources) {
	function createLightSphere() {
		let clipNode = new ClippingSGNode(null, new RenderSGNode(makeSphere(.2, 10, 10)));
		clippingNodes.push(clipNode);
		return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), clipNode);
	}

	let light = new LightSGNode();
	light.ambient = [0.1, 0.1, 0.1, 1];
	light.diffuse = [0.15, 0.15, 0.15, 1];
	light.specular = [0, 0, 0, 1];
	light.position = [0, 0, 0];
	
	// translating the light is the same as setting the light position
	let translateLight = new TransformationSGNode(glm.translate(10, -20, 10), [light, createLightSphere()]);

	let rotateNode = new TransformationSGNode(mat4.create(),
		translateLight);

	return new LightTransformationPair(light,  rotateNode);
}

function makeSpotLightWithSphere(gl, resources, x, y, z) {
	function createLightSphere() {
		let clipNode = new ClippingSGNode(null, new RenderSGNode(makeSphere(.2, 10, 10)));
		clippingNodes.push(clipNode);
		return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), clipNode);
	}

	let light = new SpotLightSGNode();
	light.ambient = [0, 0, 0, 1];
	light.diffuse = [0, 0, 0, 1];
	light.specular = [0, 0, 0, 1];
	light.position = [0, 0, 0];

	let rotateNode = new TransformationSGNode(mat4.create(),
		new TransformationSGNode(glm.translate(x, y, z),
		createLightSphere()));

	return new LightTransformationPair(light,  rotateNode);
}

function makeCrystalLight(gl, resources) {
	let light = new LightSGNode();
	light.ambient = [0, 0, 0, 1];
	light.diffuse = [0, 0, 0, 1];
	light.specular = [0, 0, 0, 1];
	light.position = [0, 0, 0];

	let rotateNode = new TransformationSGNode(mat4.create(),
		new TransformationSGNode(glm.transform({translate: [0, 0, 2 / crystalScale], rotateX: 90}),
			light));

	return new LightTransformationPair(light,  rotateNode);
}

function setSpotLightDirection() {
	spotLight.light.direction = [
		-Math.sin(deg2rad(vehicleData.rotation.z)),
		0,
		Math.cos(deg2rad(vehicleData.rotation.z - 180))];
}

/**
 * manually composed scene graph complex objects
 */

function makeCoordinateCross(gl, resources) {
	return new TransformationSGNode(mat4.create(),
		new TransformationSGNode(glm.transform({translate: [0, 0, 0], scale: 0.05}),
			new ShaderSGNode(createProgram(gl, resources.vs_cross, resources.fs_cross),
				new RenderSGNode(resources.cross))));
}

function makeVehicle(gl, resources) {
	// pyramid on top of vehicle

	let pyramidMaterial = new MaterialSGNode(
		new RenderSGNode(makePyramidRenderObject()));

	pyramidMaterial.ambient = [0.24725, 0.1995, 0.2745, 1];
	pyramidMaterial.diffuse = [0.75164, 0.60648, 0.42648, 1];
	pyramidMaterial.specular = [0.628281, 0.555802, 0.666065, 1];
	pyramidMaterial.emission = [0.1, 0.2, 0.1, 1];

	pyramidNode = new TransformationSGNode(mat4.create(), pyramidMaterial);

	// vehicle itself

	let vehicle = new MaterialSGNode([
		new RenderSGNode(makeVehicleRenderObject()),
		new TransformationSGNode(glm.transform({ translate: [0, 0, 0.5], scale: 0.75}),
			pyramidNode)]);

	vehicle.ambient = [0.24725, 0.1995, 0.2745, 1];
	vehicle.diffuse = [0.75164, 0.60648, 0.42648, 1];
	vehicle.specular = [0.628281, 0.555802, 0.666065, 1];
	vehicle.shininess = 0.4;

	return new TransformationSGNode(glm.transform({
			translate: [vehicleData.isPos.x, vehicleData.isPos.y, vehicleData.isPos.z],
			rotateX: vehicleData.rotation.x, rotateZ: vehicleData.rotation.z, rotateY: vehicleData.rotation.y}),
		[vehicle, spotLight.node]);
}

function makeIslandPlane(gl, resources) {
	let clipNode = new ClippingSGNode(null, new RenderSGNode(resources.island_plane));
	islandPlaneNode = new NiceTextureSGNode(resources.tex_grass, 0.2, clipNode);
	clippingNodes.push(clipNode);
	let islandPlane = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d),
		new MaterialSGNode(islandPlaneNode));

	islandPlane.ambient = [0, 0.3, 0, 1];
	islandPlane.diffuse = [0.52, 0.86, 0.12, 1];
	islandPlane.specular = [0.1, 0.2, 0.15, 0.];
	islandPlane.shininess = 1.0;

	islandPlane.append(crystalLight.light);
	islandPlane.append(spotLight.light);

	return new TransformationSGNode(mat4.create(),
		new TransformationSGNode(glm.transform({translate: [0, 0, 0], scale: 1.0}),
			islandPlane));
}

function makeIslandBody(gl, resources) {
	let clipNode = new ClippingSGNode(null, new RenderSGNode(resources.island_body));
	islandBodyNode = new NiceTextureSGNode(resources.tex_dry, 0.05, clipNode);
	clippingNodes.push(clipNode);

	let islandBody = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d),
		new MaterialSGNode(islandBodyNode));

	islandBody.ambient = [0, 0.3, 0, 1];
	islandBody.diffuse = [0.52, 0.86, 0.12, 1];
	islandBody.specular = [0.1, 0.2, 0.15, 0.];
	islandBody.shininess = 1.0;

	islandBody.append(mainLightDown.node);

	return new TransformationSGNode(mat4.create(),
		new TransformationSGNode(glm.transform({translate: [0, 0, 0], scale: 1.0}),
			islandBody));
}

function makeRock(gl, resources) {

	let rockMaterial = new MaterialSGNode(
		new NiceTextureSGNode(resources.tex_rock, 0.212,
		new RenderSGNode(resources.rock)));

	rockMaterial.ambient = [0, 0.3, 0, 1];
	rockMaterial.diffuse = [0.2, 0.2, 0.2, 1];
	rockMaterial.specular = [0.1, 0.1, 0.1, 0.];
	rockMaterial.shininess = 0.5;

	let rockShaderNode = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d),
		[new TransformationSGNode(glm.transform({
		translate: [rock.pos.x, rock.pos.y, rock.pos.z],
		scale: 1, rotateY: 0, rotateZ: 0}),
			rockMaterial)]);

	rockShaderNode.append(spotLight.light);
	rockShaderNode.append(crystalLight.light);

	return new TransformationSGNode(mat4.create(), rockShaderNode);
}

function makeCrab(gl, resources) {
	let crabMaterial = new MaterialSGNode(
		new RenderSGNode(resources.crab));

	crabMaterial.ambient = [1, 0.1995, 0.2745, 1];
	crabMaterial.diffuse = [1, 0.60648, 0.42648, 1];
	crabMaterial.specular = [1, 0.555802, 0.666065, 1];
	crabMaterial.shininess = 0.5;



	crabNode = new TransformationSGNode(glm.transform({translate: [-2, 0, 0], rotateY: 90}),
		new TransformationSGNode(glm.transform({translate: [0, 0, 2], rotateY: 270}),
			crabMaterial));

	return new TransformationSGNode(
		glm.transform({translate: [rock.pos.x, 0, rock.pos.z], rotateY: 270}),
		crabNode);
}

function makeCrystal(gl, resources) {
	let crystalMaterial = new MaterialSGNode([new RenderSGNode(resources.crystal)]);
	crystalMaterial.ambient = [1, 1, 0.8, 1];
	crystalMaterial.diffuse = [1, 1, 0.8, 1];
	crystalMaterial.specular = [1, 1, 0.8, 1];
	crystalMaterial.emission = [0.3, 0.3, 0.3, 1];
	crystalMaterial.shininess = 0.6;

	crystalNode = new TransformationSGNode(mat4.create(),
		[new TransformationSGNode(glm.transform({translate: [0, 0, 2.0 / crystalScale], rotateX: 90}),
			crystalMaterial)]);

	return new TransformationSGNode(glm.transform({
			translate: [crystalData.pos.x, crystalData.pos.y, crystalData.pos.z],scale: crystalScale}),
		crystalNode);
}

/**
 * functions to create renderable objects.
 */

function makeVehicleRenderObject() {
	var position = [-0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.25, -0.5, 0.5, 0.25, -0.5, 0.5, -0.5, 0.5, 0.0,
		0.5, 0.5, 0.0, -0.25, -0.5, 0.0, 0.25, -0.5, 0.0];
	var normal = [0.611748, 0.477638, 0.630576, 0, 0.707, 0.707, -0.519674, -0.665582, 0.535667, 0.519674, -0.665582, 0.535667, -0.685994, -0.171499, -0.707, -0.611748, 0.477638, -0.630576, -0.519674, -0.665582, -0.535667, 0.519674, -0.665582, -0.535667];
	var index = [0, 1, 2, 1, 2, 3, 4, 5, 6, 5, 6, 7, 0, 1, 4, 1, 4, 5, 0, 2, 4, 2, 4, 6, 2, 3, 6, 3, 6, 7, 1, 3, 5, 3, 5, 7];
	return {
		position: position,
		normal: normal,
		texture: null,
		index: index
	};
}

function makePyramidRenderObject() {
	var position = [0, 0, 0.3, 0, 0.3, 0, -0.3, -0.3, 0, 0.3, -0.3, 0];
	var normal = [0, 0, 1, 0, 0.707, 0.707, -0.534522, 0.801784, -0.267261, 0.426401, 0.639602, -0.639602];
	var index = [0, 1, 2, 0, 2, 3, 0, 3, 1];
	return {
		position: position,
		normal: null,
		texture: null,
		index: index
	};
}

function makeBillboardRenderObject(width, height) {
	var position = [-width, -height, 0, width, -height, 0, width, height, 0, -width, height, 0];
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

/**
 * main render logic
 */

function render(timeInMilliseconds) {
	let deltaInMilliseonds = timeInMilliseconds - lastTimeInMilliseconds;
	let windowGotResized = hasWindowResized(gl);

	// update animations
	renderAnimations(timeInMilliseconds, deltaInMilliseonds);

	// check input
	renderInput(timeInMilliseconds, deltaInMilliseonds);

	// render water textures
	renderWater(timeInMilliseconds, windowGotResized);

	// render opaque and transparent objects
	renderScene(timeInMilliseconds);

	// trace and next frame
	measureFps();
	requestAnimationFrame(render);

	lastTimeInMilliseconds = timeInMilliseconds;
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
	context.projectionMatrix = mat4.perspective(mat4.create(), 30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 130);
	//very primitive camera implementation
	let lookAtMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(camera.istPos.x, camera.istPos.y, camera.istPos.z), vec3.fromValues(camera.istPos.x, camera.istPos.y, lookAtZ), vec3.fromValues(0, 1, 0));
	let mouseRotateMatrix = mat4.multiply(mat4.create(),
		glm.rotateX(camera.istRotation.y),
		glm.rotateY(camera.istRotation.x));
	context.viewMatrix = mat4.multiply(mat4.create(), mouseRotateMatrix, lookAtMatrix);

	// get inverse view matrix to allow computing eye-to-light matrix
	context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

	// render water > opaque > transparent
	rootWater.render(context);
	root.render(context);
	rootTransparent.render(context);
}

function renderInput(timeInMilliseconds, deltaInMilliseonds) {
	// advance camera position
	cameraControlLoop(deltaInMilliseonds);

	// sample mouse and keyboard input every 10 milliseconds
	if ((timeInMilliseconds - lastSampleTime) > 10) {
		sampleInputs(deltaInMilliseonds);
		lastSampleTime = timeInMilliseconds;
	}
}
