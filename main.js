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
var rootWaterRender = null;
var waterRoot = null;
var transparentRoot = null;
var vehicleNode;
var pyramidNode;
var billboard;
var rockNode;

const rock  = {
  pos: {
    x: 10,
    y: 0,
    z: 4
  }
}

var animationTime = 0;
var animateRock = true;

var crabNode;
var animateCrab = true;

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

// skybox texture
var envcubetexture;

// active cubemap day = 0, night = 1
var activeCubeMap = 0;

// link to global resources
var resourcesGlobal;

// water buffers
var reflectionFrameBuf;
var refractionFrameBuf;

var frameBufferWidth = 256;
var frameBufferHeight = 256;

const waterResolution = 4.0;

var reflectionColorTex;
const reflectionColorTexUnit = 3;
var reflectionDepthBuf;

var refractionColorTex;
const refractionColorTexUnit = 4;
var refractionDepthTex;
const refractionDepthTexUnit = 5;

var islandPlaneFilter = null;
var islandBodyFilter = null;

const waterHeight = -1;

var waterShaderNode;

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
  vs_texSimple: 'shader/simpleTexture.vs.glsl',
  fs_texSimple: 'shader/simpleTexture.fs.glsl',
  vs_texWater: 'shader/waterTexture.vs.glsl',
  fs_texWater: 'shader/waterTexture.fs.glsl',
  island_body: 'models/island/models/island_body.obj',
  island_plane: 'models/island/models/island_plane.obj',
  cross: 'models/cross.obj',
  tex_tree: 'models/tree.png',
  tex_grass: 'models/island/texture/grass.jpg',
  tex_test: 'models/tex_test.jpg',
  tex_dry: 'models/island/texture/dry.jpg',
  rock: 'models/stone/models/stone.obj',
  tex_rock: 'models/stone/texture/texture.jpg',
  tex_dudv: 'models/water/dudv.jpg',
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
  env_day_neg_z: 'models/skybox/tropical_ft_min.jpg'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

function init(resources) {
  resourcesGlobal = resources;
  //create a GL context
  gl = createContext(400, 400);
  checkForWindowResize(gl);
  initCubeMap(resources);
  initRenderToTexture();

  gl.enable(gl.DEPTH_TEST);

  //create scenegraph
  rootWaterRender = new ShaderSGNode(createProgram(gl, resources.vs_phong, resources.fs_phong));
  root = createSceneGraph(gl, resources);
  waterRoot = createWaterNode(gl, resources);
  transparentRoot = createTransparentNodes(gl,  resources);

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


function initRenderToTexture() {
  var depthTextureExt = gl.getExtension("WEBGL_depth_texture");
  if(!depthTextureExt) { alert('No depth texture support. Can not render water.'); return; }

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
  gl.bindRenderbuffer(gl.RENDERBUFFER,  reflectionDepthBuf);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, frameBufferWidth, frameBufferHeight);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, reflectionDepthBuf);

  console.log("gl.FRAMEBUFFER is " + gl.checkFramebufferStatus(gl.FRAMEBUFFER) + " = " + gl.FRAMEBUFFER_COMPLETE);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!=gl.FRAMEBUFFER_COMPLETE)
  {alert('Framebuffer incomplete. Can not render water.');}

  // clean up
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  //
  //
  //
  // REFRACTION
  // framebuffer + color buffer texture attachment + depth buffer texture attachment

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

  // create depth texture
  refractionDepthTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + refractionDepthTexUnit);
  gl.bindTexture(gl.TEXTURE_2D, refractionDepthTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, frameBufferWidth, frameBufferHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

  // bind textures to framebuffer
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, refractionDepthTex, 0);

  console.log("gl.FRAMEBUFFER is " + gl.checkFramebufferStatus(gl.FRAMEBUFFER) + " = " + gl.FRAMEBUFFER_COMPLETE);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!=gl.FRAMEBUFFER_COMPLETE)
  {alert('Framebuffer incomplete. Can not render water.');}

  // clean up
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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

function createWaterNode(gl, resources)
{
  waterShaderNode = new WaterTextureSGNode(reflectionColorTex, reflectionColorTexUnit, refractionColorTex, refractionColorTexUnit, resources.tex_dudv, [0, 0, 0], [ new RenderSGNode(makeRect(9.4, 8.9)) ]);
    //let localRoot = new ShaderSGNode(createProgram(gl, resources.vs_phong, resources.fs_phong));
   let waterDemo = new ShaderSGNode(createProgram(gl, resources.vs_texWater, resources.fs_texWater), [ waterShaderNode ]);
  //localRoot.append(waterTransform);
  return new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({
    translate: [-2.2, waterHeight, -2.2],
    rotateX: 90,
    rotateZ: 40,
    scale: 1.0
  }), [waterDemo])]);

}

function createTransparentNodes(gl, resources) {

  return new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({ translate: [2, 1.5, 8], scale: 0.75, rotateX : -90, rotateZ : -90 }),  [new ShaderSGNode(createProgram(gl, resources.vs_billboard, resources.fs_tex), [new MaterialSGNode([new FilterTextureSGNode(resources.tex_tree, 1.0, [new RenderSGNode(makeBillboard(2.0, 2.0))])])])])]);
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
  root.append(mainLight1);  // upper light

  pyramidNode = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({ translate: [0,0,0.5], scale: 0.5 }),  [ new RenderSGNode(makePyramid())])]);
  let vehicle = new MaterialSGNode([
    new RenderSGNode(makeVehicle()),
    pyramidNode
  ]);
  vehicle.ambient = [0.24725, 0.1995, 0.2745, 1];
  vehicle.diffuse = [0.75164, 0.60648, 0.42648, 1];
  vehicle.specular = [0.628281, 0.555802, 0.666065, 1];
  vehicle.shininess = 0.4;

  islandPlaneFilter = new FilterTextureSGNode(resources.tex_grass, 0.2, [ new RenderSGNode(resources.island_plane) ]);
  let islandPlane = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d), [ new MaterialSGNode([ islandPlaneFilter ]) ]);
  islandPlane.ambient = [0, 0.3, 0, 1];
  islandPlane.diffuse = [0.52, 0.86, 0.12, 1];
  islandPlane.specular = [0.1, 0.2, 0.15, 0.];
  islandPlane.shininess = 1.0;
  islandPlane.append(mainLight1);
  let rotateIslandPlane = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({ translate: [0,0,0], scale: 1.0 }), [ islandPlane ]) ]);
  root.append(rotateIslandPlane);
  rootWaterRender.append(islandPlane);

  // lower part of the island
  islandBodyFilter = new FilterTextureSGNode(resources.tex_dry, 0.05, [ new RenderSGNode(resources.island_body) ]);
  let islandBody = new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex3d), [ new MaterialSGNode([ islandBodyFilter ]) ]);
  islandBody.ambient = [0, 0.3, 0, 1];
  islandBody.diffuse = [0.52, 0.86, 0.12, 1];
  islandBody.specular = [0.1, 0.2, 0.15, 0.];
  islandBody.shininess = 1.0;
  islandBody.append(mainLight2);
  let rotateIslandBody = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({ translate: [0,0,0], scale: 1.0 }), [ islandBody ]) ]);
  root.append(rotateIslandBody);
  rootWaterRender.append(rotateIslandBody);

  // coordinate cross for debugging
  let coordinateCross = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({translate: [0, 0, 0], scale: 0.05}), [ new ShaderSGNode(createProgram(gl, resources.vs_cross, resources.fs_cross), [ new RenderSGNode(resources.cross) ]) ]) ]);
  root.append(coordinateCross);

  vehicleNode = new TransformationSGNode(mat4.create(), [
      new TransformationSGNode(glm.transform({ translate: [8,0.5,4], scale: 0.5, rotateX : 270, rotateZ : 110 }),  [
      vehicle, makeLight(gl,  resources, 0, -0.5, 0.25)
      ])
    ]);
  root.append(vehicleNode);

  rockNode = new TransformationSGNode(glm.transform({ translate: [rock.pos.x, rock.pos.y, rock.pos.z], scale: 0.75, rotateY : 0, rotateZ : 0 }),  [new ShaderSGNode(createProgram(gl, resources.vs_tex3d, resources.fs_tex), [new MaterialSGNode([new FilterTextureSGNode(resources.tex_rock, 0.2, [new RenderSGNode(resources.rock)])])])]);
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
/*
  let blahShader = new ShaderSGNode(createProgram(gl, resources.vs_texSimple, resources.fs_texSimple), [ new TextureSGNode(reflectionColorTex, reflectionColorTexUnit,
          new RenderSGNode(makeRect(2,2))
      )]);

  root.append(blahShader);*/


  return root;
}

function createSolidTexture(gl, r, g, b, a) {
  var data = new Uint8Array([r, g, b, a]);
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + texture);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  gl.activeTexture(gl.TEXTURE0 + texture);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

function makeLight(gl, resources, x, y, z)
{
  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [ new RenderSGNode(makeSphere(.2,10,10)) ]);
  }

  let light = new LightSGNode();
  light.ambient = [0.2, 0.2, 0.2, 1];
  light.diffuse = [0.8, 0.8, 0.8, 1];
  light.specular = [1, 1, 1, 1];
  light.position = [0, 0, 0];

  let rotateLight = new TransformationSGNode(mat4.create());
  let translateLight = new TransformationSGNode(glm.translate(x,y,z)); //translating the light is the same as setting the light position

  rotateLight.append(translateLight);
  translateLight.append(light);
  translateLight.append(createLightSphere());

  return rotateLight;
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

function makeBillboard(width, height) {
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

  // UPDATE ANIMATIONS START
  //Note: We have to update all animations before generating the shadow map!
  //vehicleNode.matrix = glm.rotateY(timeInMilliseconds*-0.01);
  //rotateLight.matrix = glm.rotateY(timeInMilliseconds*0.05);

  // rotate lower light just for fun
  mainLight2.matrix = glm.rotateY(timeInMilliseconds*0.2);

  // animate water
  waterShaderNode.waveOffset += 0.0002;
  waterShaderNode.waveOffset %= 1.0;
  // set camera pos for water fresel effect
  waterShaderNode.camera = [camera.istPos.x, camera.istPos.y, camera.istPos.z];

  //Animate pyramid always
  pyramidNode.matrix = glm.rotateZ(timeInMilliseconds*-0.01);
  // Animate rock every 100 ms
  if(animateRock && ((timeInMilliseconds - animationTime) > 100)){
    //Alternate between 0 and 1
    rock.pos.y = (rock.pos.y+1)&1;
    rockNode.matrix = glm.transform({ translate: [rock.pos.x, rock.pos.y*0.1, rock.pos.z], scale: 0.75});
    animationTime = timeInMilliseconds;
  }
  if(animateCrab){
    crabNode.matrix = glm.rotateY(timeInMilliseconds*-0.1);
  }

  // UPDATE ANIMATIONS END
  // CONTROL CAMERA AND INPUT START

  // advance camera position
  cameraControlLoop();

  // sample mouse and keyboard input every 10 milliseconds
  if ((timeInMilliseconds - lastSampleTime) > 10) {
    sampleInputs();
    lastSampleTime = timeInMilliseconds;
  }

  if(camera.istPos.z < -15 && !userControlled){
    moveForward();
  }
  else
  {
    userControlled = true;
  }

  // CONTROL CAMERA AND INPUT END
  // WATER FRAME BUFFER OBJECT RENDER START

  //draw scene for shadow map into texture
  renderToTexture(timeInMilliseconds);

  // WATER FRAME BUFFER OBJECT RENDER END
  // MAIN SCENE RENDER START

  //setup viewport
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.0, 1.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.BLEND);
  //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  // https://limnu.com/webgl-blending-youre-probably-wrong/
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

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
  //get inverse view matrix to allow computing eye-to-light matrix
  context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

  //render scenegraph
  waterRoot.render(context);
  root.render(context);
  transparentRoot.render(context);

  // we rendered a frame
  measureFps();

  //animate
  requestAnimationFrame(render);

  // MAIN SCENE RENDER END
}

//draw scene for shadow map
function renderToTexture(timeInMilliseconds)
{
  islandPlaneFilter.enableClipping = 1;
  islandBodyFilter.enableClipping = 1;

  renderReflection(timeInMilliseconds);
  renderRefraction(timeInMilliseconds);

  islandPlaneFilter.enableClipping = 0;
  islandBodyFilter.enableClipping = 0;
}

function renderReflection(timeInMilliseconds)
{
  // clip everything underneath
  islandPlaneFilter.clipPlane = vec2.fromValues(1.0, waterHeight);
  islandBodyFilter.clipPlane = vec2.fromValues(1.0, waterHeight);

  //bind framebuffer to draw scene into texture
  gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFrameBuf);

  //setup viewport
  gl.viewport(0, 0, frameBufferWidth, frameBufferHeight);
  gl.clearColor(0.1, 0.1, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //setup context and camera matrices
  const contextWater = createSGContext(gl);
  contextWater.projectionMatrix = mat4.perspective(mat4.create(), 30, frameBufferWidth / frameBufferHeight, 0.01, 100);
  //very primitive camera implementation
//  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
  let distanceToWater = camera.istPos.y - waterHeight;
  let lookAtMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(camera.istPos.x, camera.istPos.y - 2*distanceToWater, camera.istPos.z),
      vec3.fromValues(camera.istPos.x, camera.istPos.y - 2*distanceToWater, lookAtZ), vec3.fromValues(0,1,0));
  let mouseRotateMatrix = mat4.multiply(mat4.create(),
      glm.rotateX(-camera.istRotation.y),
      glm.rotateY(camera.istRotation.x));
//  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
  contextWater.viewMatrix = mat4.multiply(mat4.create(), mouseRotateMatrix, lookAtMatrix);

  //get inverse view matrix to allow computing eye-to-light matrix
  contextWater.invViewMatrix = mat4.invert(mat4.create(), contextWater.viewMatrix);

  //render scenegraph
  root.render(contextWater); //scene graph without floor to avoid reading from the same texture as we write to...

  // disable framebuffer (render to screen again)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function renderRefraction(timeInMilliseconds)
{
  // clip everything underneath
  islandPlaneFilter.clipPlane = vec2.fromValues(-1.0, waterHeight);
  islandBodyFilter.clipPlane = vec2.fromValues(-1.0, -100.0);

  //bind framebuffer to draw scene into texture
  gl.bindFramebuffer(gl.FRAMEBUFFER, refractionFrameBuf);

  //setup viewport
  gl.viewport(0, 0, frameBufferWidth, frameBufferHeight);
  gl.clearColor(0.1, 0.1, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //setup context and camera matrices
  const contextWater = createSGContext(gl);
  contextWater.projectionMatrix = mat4.perspective(mat4.create(), 30, frameBufferWidth / frameBufferHeight, 0.01, 100);
  //very primitive camera implementation
//  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
  let lookAtMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(camera.istPos.x, camera.istPos.y, camera.istPos.z), vec3.fromValues(camera.istPos.x, camera.istPos.y, lookAtZ), vec3.fromValues(0,1,0));
  let mouseRotateMatrix = mat4.multiply(mat4.create(),
      glm.rotateX(camera.istRotation.y),
      glm.rotateY(camera.istRotation.x));
//  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
  contextWater.viewMatrix = mat4.multiply(mat4.create(), mouseRotateMatrix, lookAtMatrix);

  //get inverse view matrix to allow computing eye-to-light matrix
  contextWater.invViewMatrix = mat4.invert(mat4.create(), contextWater.viewMatrix);

  //render scenegraph
  root.render(contextWater); //scene graph without floor to avoid reading from the same texture as we write to...

  // disable framebuffer (render to screen again)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
    if (keyMap['KeyQ']) {
      moveUp();
    }
    else if (keyMap['KeyE']) {
      moveDown();
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

    console.log(fps + " fps");
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
      let ang = getDegrees(camera.sollRotation.y - delta.y);
      if(ang > 100 && ang < 260)
      {
        camera.sollRotation.y = ang;
      }
      //console.log("x: " + camera.sollRotation.x, "y: " + camera.sollRotation.y, "z: " + -Math.cos(deg2rad(camera.sollRotation.x)), "x: " + -Math.sin(deg2rad(camera.sollRotation.x)));
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

function moveUp()
{
  move(0., 0., 1.);
}

function moveDown()
{
  move(0., 0., -1.);
}

function moveForward(){
  let zpart = -Math.cos(deg2rad(camera.sollRotation.x));
  let xpart = Math.sin(deg2rad(camera.sollRotation.x));
  move(zpart, xpart, 0.);
}

function moveBackwards(){
  let zpart = Math.cos(deg2rad(camera.sollRotation.x));
  let xpart = -Math.sin(deg2rad(camera.sollRotation.x));
  move(zpart, xpart, 0.);
}

function moveRight(){
  let zpart = Math.sin(deg2rad(camera.sollRotation.x));
  let xpart = Math.cos(deg2rad(camera.sollRotation.x));
  move(zpart, xpart, 0.);
}

function moveLeft(){
  let zpart = -Math.sin(deg2rad(camera.sollRotation.x));
  let xpart = -Math.cos(deg2rad(camera.sollRotation.x));
  move(zpart, xpart, 0.);
}

function move(zpart, xpart, ypart){
  camera.sollPos.z = camera.sollPos.z + zoom*zpart;
  if(camera.sollPos.z > lookAtZ){
    camera.sollPos.z = lookAtZ + 0.01;
  }
  camera.sollPos.x = camera.sollPos.x + zoom*xpart;
  camera.sollPos.y = camera.sollPos.y + zoom*ypart;
  //console.log("z :" + camera.sollPos.z, "x :" + camera.sollPos.x);
}

function deg2rad(degrees) {
  return degrees * Math.PI / 180;
}
