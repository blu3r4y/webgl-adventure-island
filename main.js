/**
 * Created by Clemens Birklbauer on 22.02.2016.
 */
'use strict';

var gl = null;
//Camera struct that stores the camera rotation mario
const camera = {
  rotation: {
    x: 0,
    y: 50
  },
  pos: {
    x: 0,
    y: 0,
    z: 10
  }
};

var zoom = 0.02;

//scene graph nodes
var root = null;
var rootnofloor = null;
var translateLight;
var rotateLight;
var lightNode;
var vehicleNode;
var shadowNode;
var pyramidNode;
var billboard;

var translate;
var renderFloor;

//textures
var envcubetexture;
var renderTargetColorTexture;
var renderTargetDepthTexture;

//framebuffer variables
var renderTargetFramebuffer;
var framebufferWidth = 1024;
var framebufferHeight = 1024;

var lightViewProjectionMatrix;

var userControlled = false;

//load the required resources using a utility function
loadResources({
  vs_shadow: 'shader/shadow.vs.glsl',
  fs_shadow: 'shader/shadow.fs.glsl',
  vs_single: 'shader/single.vs.glsl',
  fs_single: 'shader/single.fs.glsl',
  fs_island: 'shader/island.fs.glsl',
  vs_tex: 'shader/texture.vs.glsl',
  fs_tex: 'shader/texture.fs.glsl',
  island: 'models/island.obj',
  vehicle: 'models/vehicle.obj',
  tree: 'models/tree2.png'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

function init(resources) {
  //create a GL context
  gl = createContext(400, 400);

  gl.enable(gl.DEPTH_TEST);

  //create scenegraph
  root = createSceneGraph(gl, resources);

  //create scenegraph without floor and simple shader
  //rootnofloor = new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single));
  //rootnofloor.append(vehicleNode); //reuse model part

  initInteraction(gl.canvas);
}

function createSceneGraph(gl, resources) {
  //create scenegraph
  const root = new ShaderSGNode(createProgram(gl, resources.vs_shadow, resources.fs_shadow));
  pyramidNode = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({ translate: [0,0,0.5], scale: 0.5 }),  [ new RenderSGNode(makePyramid())])]);
  let vehicle = new MaterialSGNode([ //use now framework implementation of material node
    new RenderSGNode(makeVehicle()),
    pyramidNode
  ]);
  //vehicle.append(new RenderSGNode(makePyramid()));
  //gold
  vehicle.ambient = [0.24725, 0.1995, 0.2745, 1];
  vehicle.diffuse = [0.75164, 0.60648, 0.42648, 1];
  vehicle.specular = [0.628281, 0.555802, 0.666065, 1];
  vehicle.shininess = 0.4;
  let island = new RenderSGNode(resources.island);
  root.append(island);

//  billboard = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({ translate: [-2,-2,0.5], scale: 0.25, rotateZ: 90 }),  [new ShaderSGNode(createProgram(gl, resources.vs_tex, resources.fs_tex), [new MaterialSGNode([new AdvancedTextureSGNode(resources.tree, [new RenderSGNode(makeBillboard())])])])])]);
   billboard = new TransformationSGNode(glm.transform({ translate: [-2,-2,0.5], scale: 1}),  [new ShaderSGNode(createProgram(gl, resources.vs_tex, resources.fs_tex), [new MaterialSGNode([new AdvancedTextureSGNode(resources.tree, [new RenderSGNode(makeBillboard())])])])]);
  root.append(billboard);
  //add node for setting shadow parameters
  //initialize light
  let light = new LightSGNode(); //use now framework implementation of light node
  light.ambient = [0.2, 0.2, 0.2, 1];
  light.diffuse = [0.8, 0.8, 0.8, 1];
  light.specular = [1, 1, 1, 1];
  light.position = [0,-0.5,0.25];

  function createLightSphere() {
      return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
        new RenderSGNode(makeSphere(.2,10,10))
      ]);
    }

  rotateLight = new TransformationSGNode(mat4.create());
//  let translateLight = new TransformationSGNode(glm.translate(0,-2,2)); //translating the light is the same as setting the light position
  let translateLight =  new TransformationSGNode(glm.translate(0,-0.5,0.25));
  let lightSphere = new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [new RenderSGNode(makeSphere(.1,10,10)) ]);
//  rotateLight.append(translateLight);
  translateLight.append(light);
//  translateLight.append(createLightSphere()); //add sphere for debugging: since we use 0,0,0 as our light position the sphere is at the same position as the light source
  translateLight.append(lightSphere);
  //root.append(rotateLight);
  vehicleNode = new TransformationSGNode(mat4.create(), [
      new TransformationSGNode(glm.transform({ translate: [0,0,0.1], scale: 0.5 }),  [
      vehicle, translateLight
      ])
    ]);
  root.append(vehicleNode);
  billboard = new TransformationSGNode(glm.transform({ translate: [-2,-2,0.5], scale: 0.25}),  [new ShaderSGNode(createProgram(gl, resources.vs_tex, resources.fs_tex), [new MaterialSGNode([new AdvancedTextureSGNode(resources.tree, [new RenderSGNode(makeBillboard())])])])]);
  return root;
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
  let lookAtMatrix = mat4.lookAt(mat4.create(), [camera.pos.x, camera.pos.y, camera.pos.z], [camera.pos.x, camera.pos.y, 0], [0,1,0]);
  let mouseRotateMatrix = mat4.multiply(mat4.create(),
                          glm.rotateX(camera.rotation.y),
                          glm.rotateY(camera.rotation.x));
  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
  if(camera.pos.z > 0 && !userControlled){
      camera.pos.z = camera.pos.z - zoom;
  }
//  pyramidNode.matrix = glm.rotateZ(timeInMilliseconds*-0.01);
//  billboard.matrix =  glm.rotateZ(timeInMilliseconds*-0.01);
//  context.viewMatrix = glm.rotateY(timeInMilliseconds*-0.01);
  //get inverse view matrix to allow computing eye-to-light matrix
  context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

  //render scenegraph
  root.render(context);

  //animate
  requestAnimationFrame(render);
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
    const delta = { x : mouse.pos.x - pos.x, y: mouse.pos.y - pos.y };
    if (mouse.leftButtonDown) {
      //add the relative movement of the mouse to the rotation variables
  		camera.rotation.x += delta.x;
  		camera.rotation.y += delta.y;
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
    } else if(userControlled){
        if(event.code === 'KeyP'){
          camera.pos.z = camera.pos.z - zoom;
        }
        else if(event.code === 'KeyL'){
          camera.pos.z = camera.pos.z + zoom;
        }
    }
  });
  document.addEventListener('keydown', function(event) {
    //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    if(userControlled) {
      if (event.code === 'ArrowUp') {
        camera.pos.y = camera.pos.y - zoom;
      }
      else if (event.code === 'ArrowDown') {
        camera.pos.y = camera.pos.y + zoom;
      }
      else if (event.code === 'ArrowRight') {
        camera.pos.x = camera.pos.x - zoom;
      }
      else if (event.code === 'ArrowLeft') {
        camera.pos.x = camera.pos.x + zoom;
      }
    }
  });


}
