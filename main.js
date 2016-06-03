/**
 * Created by Clemens Birklbauer on 22.02.2016.
 */
'use strict';

var gl = null;
//Camera struct that stores the camera rotation mario
const camera = {
  rotation: {
    x: 0,
    y: 0
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
var rotateNode;
var shadowNode;

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
  island: 'models/island.obj',
  vehicle: 'models/vehicle.obj'
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
  //rootnofloor.append(rotateNode); //reuse model part

  initInteraction(gl.canvas);
}

function createSceneGraph(gl, resources) {
  //create scenegraph
//  const root = new ShaderSGNode(createProgram(gl, resources.vs_shadow, resources.fs_shadow));
  const root = new ShaderSGNode(createProgram(gl, resources.vs_shadow, resources.fs_shadow));
  let islandsh = new ShaderSGNode(createProgram(gl, resources.vs_shadow, resources.fs_island));
  let island = new RenderSGNode(resources.island);
  islandsh.append(island);
  let vehicle = new MaterialSGNode([ //use now framework implementation of material node
    new RenderSGNode(resources.vehicle)
  ]);
  //gold
  vehicle.ambient = [0.24725, 0.1995, 0.0745, 1];
  vehicle.diffuse = [0.75164, 0.60648, 0.22648, 1];
  vehicle.specular = [0.628281, 0.555802, 0.366065, 1];
  vehicle.shininess = 0.4;
  root.append(islandsh);

  let rotateNode = new TransformationSGNode(mat4.create(), [
      new TransformationSGNode(glm.transform({ translate: [0,0,0.1], rotateX : 0, scale: 0.5 }),  [
       vehicle
      ])
    ]);
  root.append(rotateNode);
  //add node for setting shadow parameters
  //initialize light
  let light = new LightSGNode(); //use now framework implementation of light node
  light.ambient = [0.2, 0.2, 0.2, 1];
  light.diffuse = [0.8, 0.8, 0.8, 1];
  light.specular = [1, 1, 1, 1];
  light.position = [0, 0, 0];

  function createLightSphere() {
      return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
        new RenderSGNode(makeSphere(.2,10,10))
      ]);
    }

  rotateLight = new TransformationSGNode(mat4.create());
  let translateLight = new TransformationSGNode(glm.translate(0,-2,2)); //translating the light is the same as setting the light position

  rotateLight.append(translateLight);
  translateLight.append(light);
  translateLight.append(createLightSphere()); //add sphere for debugging: since we use 0,0,0 as our light position the sphere is at the same position as the light source
  root.append(rotateLight);

  return root;
}

function render(timeInMilliseconds) {
  checkForWindowResize(gl);

  //update animations
  //Note: We have to update all animations before generating the shadow map!
  //rotateNode.matrix = glm.rotateY(timeInMilliseconds*-0.01);
  //rotateLight.matrix = glm.rotateY(timeInMilliseconds*0.05);

  //setup viewport
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //setup context and camera matrices
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), 30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  //very primitive camera implementation
  let lookAtMatrix = mat4.lookAt(mat4.create(), [camera.pos.x, camera.pos.y, camera.pos.z], [0,0,0], [0,1,0]);
  let mouseRotateMatrix = mat4.multiply(mat4.create(),
                          glm.rotateX(camera.rotation.y),
                          glm.rotateY(camera.rotation.x));
  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
  if(camera.pos.z > 0 && !userControlled){
      camera.pos.z = camera.pos.z - zoom;
  }
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
    }
  });
  document.addEventListener('keydown', function(event) {
    //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    if(userControlled) {
      if (event.code === 'ArrowUp') {
        camera.pos.z = camera.pos.z - zoom;
      }
      else if (event.code === 'ArrowDown') {
        camera.pos.z = camera.pos.z + zoom;
      }
      else if (event.code === 'ArrowRight') {
        camera.pos.x = camera.pos.x + zoom;
      }
      else if (event.code === 'ArrowLeft') {
        camera.pos.x = camera.pos.x - zoom;
      }
    }
  });


}
