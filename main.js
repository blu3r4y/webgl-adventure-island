/**
 * Created by Clemens Birklbauer on 22.02.2016.
 */
'use strict';

var gl = null;
//Camera struct that stores the camera sollRotation mario
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

// remembers pressed keys
var keyMap = [];

var lookAtZ = 40;

//scene graph nodes
var root = null;
var vehicleNode;

const vehicleData = {
  pos: {
    x: 8,
    y: 0.5,
    z: 4
  },
  rotation: {
    x: 90,
    y: 180,
    z: 0
  }
}

var pyramidNode;
var billboard;
var rockNode;
var rockShaderNode;

const rock  = {
  pos: {
    x: 10,
    y: 0,
    z: 4
  }
}

var islandPlane;

var animationTime = 0;
var animateRock = true;

var crabNode;
var animateCrab = true;

var crystalNode;
var animateCrystal = true;
var crystalY = 0;

var invertedCamera = false;
var userControlled = false;
var zoom = 0.2;

// fps measurement - taken from http://stackoverflow.com/a/16432859
var elapsedTime = 0;
var frameCount = 0;
var lastTime = new Date().getTime();


var lastSampleTime = 0;

// light sources (rotation nodes)
var mainLight1;
var mainLight2;
// spot light source (only light node)
var spotLight;

// skybox texture
var envcubetexture;

// active cubemap day = 0, night = 1
var activeCubeMap = 0;

// link to global resources
var resourcesGlobal;

//load the required resources using a utility function
loadResources({
  vs_gouraud: 'shader/gouraud.vs.glsl',
  fs_gouraud: 'shader/gouraud.fs.glsl',
  vs_phong: 'shader/phong.vs.glsl',
  fs_phong: 'shader/phong.fs.glsl',
  vs_single: 'shader/single.vs.glsl',
  fs_single: 'shader/single.fs.glsl',
  vs_cross: 'shader/cross.vs.glsl',
  fs_cross: 'shader/cross.fs.glsl',
  vs_billboard: 'shader/texture.vs.glsl',
  fs_tex3d: 'shader/texture3d.fs.glsl',
  vs_tex3d: 'shader/texture3d.vs.glsl',
  fs_tex: 'shader/texture.fs.glsl',
  vs_env: 'shader/envmap.vs.glsl',
  fs_env: 'shader/envmap.fs.glsl',
  island_body: 'models/island/models/island_body.obj',
  island_plane: 'models/island/models/island_plane.obj',
  cross: 'models/cross.obj',
  tex_tree: 'models/tree.png',
  tex_grass: 'models/island/texture/grass.jpg',
  tex_test: 'models/tex_test.jpg',
  tex_dry: 'models/island/texture/dry.jpg',
  rock: 'models/stone/models/stone.obj',
  tex_rock: 'models/stone/texture/texture.jpg',
  crab: 'models/crab/crab.obj',
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
  env_day_neg_z: 'models/skybox/tropical_ft_min.jpg',
  crystal: 'models/crystal/crystal.obj'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

function init(resources) {
  resourcesGlobal = resources;
  //create a GL context
  gl = createContext(400, 400);
  initCubeMap(resources);

  gl.enable(gl.DEPTH_TEST);

  //create scenegraph
  root = createSceneGraph(gl, resources);

  initInteraction(gl.canvas);
}

function initCubeMap(resources) {
  //create the texture
  envcubetexture = gl.createTexture();
  //define some texture unit we want to work on
  gl.activeTexture(gl.TEXTURE0);
  //bind the texture to the texture unit
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, envcubetexture);
  //set sampling parameters
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.MIRRORED_REPEAT); //will be available in WebGL 2
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  //set correct image for each side of the cube map
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_day_pos_x);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_day_neg_x);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_day_pos_y);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_day_neg_y);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_day_pos_z);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_day_neg_z);
  //generate mipmaps (optional)
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  // enable anisotropic filtering
  var ext = gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
  var max_anisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
  gl.texParameterf(gl.TEXTURE_CUBE_MAP, ext.TEXTURE_MAX_ANISOTROPY_EXT, max_anisotropy);
  //unbind the texture again
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

  activeCubeMap = 0;
}

function toggleCubeMapTexture(type)
{
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, envcubetexture);

  if (type === 0)
  {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_pos_x);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_neg_x);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_pos_y);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_neg_y);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_pos_z);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_neg_z);
  }
  else
  {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_pos_x);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_neg_x);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_pos_y);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_neg_y);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_pos_z);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_neg_z);
  }

  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

  activeCubeMap = type;
}

function createSceneGraph(gl, resources) {

  // phong shader as root
  const root = new ShaderSGNode(createProgram(gl, resources.vs_phong, resources.fs_phong));

  //add skybox by putting large sphere around us
  var skybox = new ShaderSGNode(createProgram(gl, resources.vs_env, resources.fs_env), [ new EnvironmentSGNode(envcubetexture, 4, false,
      new RenderSGNode(makeSphere(50))) ]);
  root.append(skybox);

  // y axis of light source does not work as expected somehow
  mainLight1 = makeLight(gl, resources, 0, 10, 0);
  mainLight2 = makeLight(gl, resources, 10, -20, 10);

  // main light sources
//  root.append(mainLight1);  // upper light

  pyramidNode = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({ translate: [0,0,0.5], scale: 0.5 }),  [ new RenderSGNode(makePyramid())])]);
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
      new TransformationSGNode(glm.transform({ translate: [vehicleData.pos.x,vehicleData.pos.y,vehicleData.pos.z], rotateX : vehicleData.rotation.x, rotateZ: vehicleData.rotation.z, rotateY:  vehicleData.rotation.y }),  [
      vehicle, spLight
    //  ])
    ]);
  root.append(vehicleNode);

  islandPlane = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d), [ new MaterialSGNode([ new FilterTextureSGNode(resources.tex_grass, 0.2, [ new RenderSGNode(resources.island_plane) ]) ]) ]);
  islandPlane.ambient = [0, 0.3, 0, 1];
  islandPlane.diffuse = [0.52, 0.86, 0.12, 1];
  islandPlane.specular = [0.1, 0.2, 0.15, 0.];
  islandPlane.shininess = 1.0;
//  islandPlane.append(mainLight1);
  islandPlane.append(new TransformationSGNode(glm.transform({ translate: [vehicleData.pos.x,vehicleData.pos.y,vehicleData.pos.z], rotateX : vehicleData.rotation.x, rotateZ: vehicleData.rotation.z, rotateY:  vehicleData.rotation.y }),  [spotLight]));
  let rotateIslandPlane = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({ translate: [0,0,0], scale: 1.0 }), [ islandPlane ]) ]);
  root.append(rotateIslandPlane);

  // lower part of the island
  let islandBody = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d), [ new MaterialSGNode([ new FilterTextureSGNode(resources.tex_dry, 0.05, [ new RenderSGNode(resources.island_body) ]) ]) ]);
  islandBody.ambient = [0, 0.3, 0, 1];
  islandBody.diffuse = [0.52, 0.86, 0.12, 1];
  islandBody.specular = [0.1, 0.2, 0.15, 0.];
  islandBody.shininess = 1.0;
  islandBody.append(mainLight2);
  let rotateIslandBody = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({ translate: [0,0,0], scale: 1.0 }), [ islandBody ]) ]);
  root.append(rotateIslandBody);

  let waterDemo = new MaterialSGNode([ new RenderSGNode(makeRect(9.4, 8.9)) ]);
  waterDemo.ambient = [0.3, 0.15, 0.12, 0.3];
  waterDemo.diffuse = [0.52, 0.86, 0.98, 0.5];
  waterDemo.specular = [0.1, 0.2, 0.25, 0.5];
  waterDemo.shininess = 1.0;
  let rotateWaterDemo = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({ translate: [-2.2,-1,-2.2], rotateX : 90, rotateZ : 40, scale: 1.0 }), [ waterDemo ]) ]);
  root.append(rotateWaterDemo);

  // coordinate cross for debugging
  let coordinateCross = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({translate: [0, 0, 0], scale: 0.05}), [ new ShaderSGNode(createProgram(gl, resources.vs_cross, resources.fs_cross), [ new RenderSGNode(resources.cross) ]) ]) ]);
  root.append(coordinateCross);

  // tex_tree billboard
  let billboard = new TransformationSGNode(glm.transform({ translate: [2, 1, 8], scale: 0.75, rotateX : -90, rotateZ : -90 }),  [new ShaderSGNode(createProgram(gl, resources.vs_billboard, resources.fs_tex), [new MaterialSGNode([new FilterTextureSGNode(resources.tex_tree, 1.0, [new RenderSGNode(makeBillboard())])])])]);
  root.append(billboard);

  rockShaderNode = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d), [ new TransformationSGNode(glm.transform({ translate: [rock.pos.x, rock.pos.y, rock.pos.z], scale: 0.75, rotateY : 90, rotateZ : 0 }), [new MaterialSGNode([new FilterTextureSGNode(resources.tex_rock, 0.2, [new RenderSGNode(resources.rock)])])])]);
  rockShaderNode.append(new TransformationSGNode(glm.transform({ translate: [vehicleData.pos.x,vehicleData.pos.y,vehicleData.pos.z], rotateX : vehicleData.rotation.x, rotateZ: vehicleData.rotation.z, rotateY:  vehicleData.rotation.y }),  [spotLight]));
//  rockShaderNode.append(mainLight1);
  rockNode = new TransformationSGNode(mat4.create(),  [rockShaderNode]);
  root.append(rockNode);
  let crab = new MaterialSGNode([new RenderSGNode(resources.crab)]);
  crab.ambient = [1, 0.1995, 0.2745, 1];
  crab.diffuse = [1, 0.60648, 0.42648, 1];
  crab.specular = [1, 0.555802, 0.666065, 1];
  crab.shininess = 0.5;
  crabNode = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({ translate: [0, 0, 2], rotateY: 270}),  [
        crab ])
    ]);
  root.append(new TransformationSGNode(glm.transform({ translate: [rock.pos.x, 0, rock.pos.z], rotateY: 270}),  [crabNode]));
  let crystal = new MaterialSGNode([new RenderSGNode(resources.crystal)]);
  crystal.ambient = [1, 1, 0.8, 1];
  crystal.diffuse = [1, 1, 0.8, 1];
  crystal.specular = [1, 1, 0.8, 1];
  crystal.shininess = 0.5;
  crystalNode = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({ translate: [0, 0, 2/0.025], rotateX: 90}),  [
        crystal ])
    ]);
  root.append(new TransformationSGNode(glm.transform({ translate: [0, 0, 7], scale: 0.025}) , crystalNode));

  return root;
}

function makeLight(gl, resources, x, y, z)
{
  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [ new RenderSGNode(makeSphere(.2,10,10)) ]);
  }

  let light = new LightSGNode();
  light.ambient = [0.0, 0.0, 0.0, 1];
  light.diffuse = [0.1, 0.1, 0.1, 1];
  light.specular = [0.1, 0.1, 0.1, 1];
  light.position = [0, 0, 0];

  let rotateLight = new TransformationSGNode(mat4.create());
  let translateLight = new TransformationSGNode(glm.translate(x,y,z)); //translating the light is the same as setting the light position

  rotateLight.append(translateLight);
  translateLight.append(light);
  translateLight.append(createLightSphere());

  return rotateLight;
}

function makeSpotLight(gl, resources, x, y, z)
{
  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [ new RenderSGNode(makeSphere(.2,10,10)) ]);
  }

  spotLight = new SpotLightSGNode();
  spotLight.ambient = [0.1, 0.1, 0.1, 1];
  spotLight.diffuse = [1, 1, 1, 1];
  spotLight.specular = [1, 1, 1, 1];
  spotLight.position = [0,0,0];
  setSpotLightDirection();

  let rotateLight = new TransformationSGNode(mat4.create());
  let translateLight = new TransformationSGNode(glm.translate(x,y,z)); //translating the light is the same as setting the light position

  rotateLight.append(translateLight);
  translateLight.append(spotLight);
  translateLight.append(createLightSphere());

  return rotateLight;
}

function setSpotLightDirection(){
  spotLight.direction = [-Math.sin(deg2rad(camera.sollRotation.x + vehicleData.rotation.z - 180)), 0, Math.cos(deg2rad(camera.sollRotation.x + vehicleData.rotation.z - 180))];
}

function makeVehicle() {
  var position = [-0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.25, -0.5, 0.5, 0.25, -0.5, 0.5, -0.5, 0.5, 0.0,
  0.5, 0.5, 0.0, -0.25, -0.5, 0.0, 0.25, -0.5, 0.0];
  var normal = [-1, -1, -1,   1, -1, -1,   -1, 1, -1,   1, 1, -1,  -1, -1, 1,   1, -1, 1,   -1, 1, 1,   1, 1, 1];
  var texturecoordinates = [0, 0,   5, 0,   5, 5,   0, 5,  5, 0,   5, 5,   0, 0, 0, 0];
  var index = [0, 1, 2,  1, 2, 3,  4, 5, 6,  5, 6, 7, 0, 1, 4, 1, 4, 5, 0, 2, 4, 2, 4, 6, 2, 3, 6, 3, 6, 7, 1, 3, 5, 3, 5, 7];
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

function makeBillboard() {
  var width = 1;
  var height = 1;
  var position = [-width, -height, 0,    width,  -height, 0,    width,  height,0,   -width, height, 0, ];
  var normal = [0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1];
  var texturecoordinates = [0, 0,   1, 0,   1, 1,   0, 1];
  var index = [0, 1, 2,  2, 3, 0];
  return {
    position: position,
    normal: normal,
    texture: texturecoordinates,
    index: index
  };
}

function render(timeInMilliseconds) {
  checkForWindowResize(gl);

  //update animations
  //Note: We have to update all animations before generating the shadow map!
  //vehicleNode.matrix = glm.rotateY(timeInMilliseconds*-0.01);
  //rotateLight.matrix = glm.rotateY(timeInMilliseconds*0.05);

  // advance camera position
  cameraControlLoop();

  // sample mouse and keyboard input every 10 milliseconds
  if ((timeInMilliseconds - lastSampleTime) > 10) {
    sampleInputs();
    lastSampleTime = timeInMilliseconds;
  }

  // rotate lower light just for fun
  mainLight2.matrix = glm.rotateY(timeInMilliseconds*0.2);

  //setup viewport
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  //setup context and camera matrices
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), 30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  //very primitive camera implementation
  let lookAtMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(camera.istPos.x, camera.istPos.y, camera.istPos.z), vec3.fromValues(camera.istPos.x, camera.istPos.y, lookAtZ), vec3.fromValues(0,1,0));
  let mouseRotateMatrix = mat4.multiply(mat4.create(),
                          glm.rotateX(camera.istRotation.y),
                          glm.rotateY(camera.istRotation.x));
//  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
  context.viewMatrix = mat4.multiply(mat4.create(), mouseRotateMatrix, lookAtMatrix);
  if(camera.istPos.z < -15 && !userControlled){
      moveForward();
  }
  else
  {
    userControlled = true;
  }
  //Animate pyramid always
  pyramidNode.matrix = glm.rotateZ(timeInMilliseconds*-0.01);
  // Animate rock every 100 ms
  if(animateRock && ((timeInMilliseconds - animationTime) > 100)){
    //Alternate between 0 and 1
    rock.pos.y = (rock.pos.y+1)&1;
    rockNode.matrix = glm.transform({ translate: [0, rock.pos.y*0.1, 0]});
    animationTime = timeInMilliseconds;
  }
  if(animateCrab){
    crabNode.matrix = glm.rotateY(timeInMilliseconds*-0.1);
  }
  if(animateCrystal){
    crystalNode.matrix = glm.transform({translate: [0, crystalY++, 0], rotateY: timeInMilliseconds*-0.1});
    if(crystalY > 10/0.025){
      animateCrystal = false;
    }
  }
  vehicleData.rotation.z = timeInMilliseconds*-0.1;
  vehicleNode.matrix = glm.transform({ translate: [vehicleData.pos.x,vehicleData.pos.y,vehicleData.pos.z], rotateZ : vehicleData.rotation.z, rotateX: vehicleData.rotation.x, rotateY: vehicleData.rotation.y  });
  rockShaderNode.matrix = glm.transform({ translate: [vehicleData.pos.x,vehicleData.pos.y,vehicleData.pos.z], rotateZ : vehicleData.rotation.z, rotateX: vehicleData.rotation.x, rotateY: vehicleData.rotation.y  });
  islandPlane.matrix = glm.transform({ translate: [vehicleData.pos.x,vehicleData.pos.y,vehicleData.pos.z], rotateZ : vehicleData.rotation.z, rotateX: vehicleData.rotation.x, rotateY: vehicleData.rotation.y  });
  setSpotLightDirection();
  //get inverse view matrix to allow computing eye-to-light matrix
  context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

  //render scenegraph
  root.render(context);

  //animate
  requestAnimationFrame(render);
  measureFps();
}

function sampleInputs()
{
  if(userControlled) {
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
  }
}

// advances the cameras ist position towards the soll position
function cameraControlLoop()
{
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
function diffValueController(src, dest, k)
{
  let diff = dest - src;

  // return scaled difference if the value exceeds the minimum error allowed
  if (Math.abs(diff) > 0.1) return diff * k;
  return 0;
}

// calcutes a simple linear difference between the src and dest value
// with respect to degree values which have the special property to overflow at 360 back to 0.
function rotDiffValueController(src, dest, k)
{
  let diff = dest - src;

  if (Math.abs(diff) > 180)
  {
    // if we move through 0 or 360 the controller needs to pass this point too
    diff = (src > dest ? diff + 360 : diff - 360) % 360;
  }

  // return scaled difference if the value exceeds the minimum error allowed
  if (Math.abs(diff) > 1) return diff * k;
  return 0;
}

// fps measurement - taken from http://stackoverflow.com/a/16432859
function measureFps()
{
  var now = new Date().getTime();

  frameCount++;
  elapsedTime += (now - lastTime);

  lastTime = now;

  if (elapsedTime >= 1000)
  {
    let fps = frameCount;
    frameCount = 0;
    elapsedTime -= 1000;

    //console.log(fps + " fps");
  }
}

//camera control
function initInteraction(canvas) {
  const mouse = {
    pos: { x : 0, y : 0},
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
  canvas.addEventListener('mousedown', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = event.button === 0;
  });
  canvas.addEventListener('mousemove', function(event) {
    const pos = toPos(event);
    const delta = { x : mouse.pos.x - pos.x,
                    y : invertedCamera ? mouse.pos.y - pos.y : pos.y - mouse.pos.y };
    if (mouse.leftButtonDown) {
      //add the relative movement of the mouse to the sollRotation variables
  		camera.sollRotation.x = getDegrees(camera.sollRotation.x - delta.x);
      setSpotLightDirection();
      let ang = getDegrees(camera.sollRotation.y - delta.y);
      if(ang > 100 && ang < 260)
      {
        camera.sollRotation.y = ang;
      }
      console.log("x: " + camera.sollRotation.x, "y: " + camera.sollRotation.y, "z: " + -Math.cos(deg2rad(camera.sollRotation.x)), "x: " + -Math.sin(deg2rad(camera.sollRotation.x)));
    }
    mouse.pos = pos;
  });
  canvas.addEventListener('mouseup', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = false;
  });
  //register globally
  document.addEventListener('keypress', function(event) {
    //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    if (event.code === 'KeyC') {
      userControlled = !userControlled;
    }
    else if (event.code === 'KeyN')
    {
      toggleCubeMapTexture(activeCubeMap === 0 ? 1 : 0);
    }
  });
  // map pressed keys
  document.addEventListener('keydown', function(event) {
    keyMap[event.code] = true;
  });
  // unmap pressed keys
  document.addEventListener('keyup', function(event) {
    keyMap[event.code] = false;
  });

  function getDegrees(angle){
    angle = angle%360;
    if(angle < 0){
      angle += 360;
    }
    return angle;
  }

}

function moveForward(){
  let zpart = -Math.cos(deg2rad(camera.sollRotation.x));
  let xpart = Math.sin(deg2rad(camera.sollRotation.x));
  move(zpart, xpart);
}

function moveBackwards(){
  let zpart = Math.cos(deg2rad(camera.sollRotation.x));
  let xpart = -Math.sin(deg2rad(camera.sollRotation.x));
  move(zpart, xpart);
}

function moveRight(){
  let zpart = Math.sin(deg2rad(camera.sollRotation.x));
  let xpart = Math.cos(deg2rad(camera.sollRotation.x));
  move(zpart, xpart);
}

function moveLeft(){
  let zpart = -Math.sin(deg2rad(camera.sollRotation.x));
  let xpart = -Math.cos(deg2rad(camera.sollRotation.x));
  move(zpart, xpart);
}

function move(zpart, xpart){
  camera.sollPos.z = camera.sollPos.z + zoom*zpart;
  if(camera.sollPos.z > lookAtZ){
    camera.sollPos.z = lookAtZ + 0.01;
  }
  camera.sollPos.x = camera.sollPos.x + zoom*xpart;
  //console.log("z :" + camera.sollPos.z, "x :" + camera.sollPos.x);
}

function deg2rad(degrees) {
  return degrees * Math.PI / 180;
}
