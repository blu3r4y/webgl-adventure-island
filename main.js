/**
 * Created by Clemens Birklbauer on 22.02.2016.
 */
'use strict';

var gl = null;
//Camera struct that stores the camera rotation mario
const camera = {
  rotation: {
    x: 270,
    y: 210
  },
  pos: {
    x: -5,
    y: 5,
    z: -40
  }
};

//scene graph nodes
var root = null;
var vehicleNode;
var pyramidNode;

var userControlled = false;
var zoom = 0.2;

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
  vs_tex: 'shader/texture.vs.glsl',
  fs_tex: 'shader/texture.fs.glsl',
  island_body: 'models/island_body.obj',
  island_plane: 'models/island_plane.obj',
  vehicle: 'models/vehicle.obj',
  cross: 'models/cross.obj',
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

  initInteraction(gl.canvas);
}

function createSceneGraph(gl, resources) {

  // phong shader as root
  const root = new ShaderSGNode(createProgram(gl, resources.vs_phong, resources.fs_phong));

  pyramidNode = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({ translate: [0,0,0.5], scale: 0.5 }),  [ new RenderSGNode(makePyramid())])]);
  let vehicle = new MaterialSGNode([
    new RenderSGNode(makeVehicle()),
    pyramidNode
  ]);
  //vehicle.append(new RenderSGNode(makePyramid()));
  //gold
  vehicle.ambient = [0.24725, 0.1995, 0.2745, 1];
  vehicle.diffuse = [0.75164, 0.60648, 0.42648, 1];
  vehicle.specular = [0.628281, 0.555802, 0.666065, 1];
  vehicle.shininess = 0.4;

  // island top side
  let islandPlane = new MaterialSGNode([ new RenderSGNode(resources.island_plane) ]);
  islandPlane.ambient = [0, 0.3, 0, 1];
  islandPlane.diffuse = [0.52, 0.86, 0.12, 1];
  islandPlane.specular = [0.1, 0.2, 0.15, 0.];
  islandPlane.shininess = 1.0;
  let rotateIslandPlane = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({ translate: [0,0,0], scale: 1.0 }), [ islandPlane ]) ]);
  root.append(rotateIslandPlane);

  // lower part of the island
  let islandBody = new MaterialSGNode([ new RenderSGNode(resources.island_body) ]);
  islandPlane.ambient = [0.3, 0.35, 0.58, 1];
  islandPlane.diffuse = [0.52, 0.86, 0.12, 1];
  islandPlane.specular = [0.1, 0.2, 0.15, 0.];
  islandPlane.shininess = 1.0;
  let rotateIslandBody = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({ translate: [0,0,0], scale: 1.0 }), [ islandBody ]) ]);
  root.append(rotateIslandBody);

  let waterDemo = new MaterialSGNode([ new RenderSGNode(makeRect(8.4, 8.9)) ]);
  waterDemo.ambient = [0.3, 0.15, 0.12, 0.3];
  waterDemo.diffuse = [0.52, 0.86, 0.98, 0.5];
  waterDemo.specular = [0.1, 0.2, 0.25, 0.5];
  waterDemo.shininess = 1.0;
  let rotateWaterDemo = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({ translate: [-3,-1,-3], rotateX : 90, rotateZ : 40, scale: 1.0 }), [ waterDemo ]) ]);
  root.append(rotateWaterDemo);

  // coordinate cross for debugging
  let coordinateCross = new TransformationSGNode(mat4.create(), [ new TransformationSGNode(glm.transform({translate: [0, 0, 0], scale: 0.05}), [ new ShaderSGNode(createProgram(gl, resources.vs_cross, resources.fs_cross), [ new RenderSGNode(resources.cross) ]) ]) ]);
  root.append(coordinateCross);

  // tree billboard
  let billboard = new TransformationSGNode(mat4.create(), [new TransformationSGNode(glm.transform({ translate: [2, 1, 8], scale: 0.75, rotateX : -90, rotateZ : -90 }),  [new ShaderSGNode(createProgram(gl, resources.vs_tex, resources.fs_tex), [new MaterialSGNode([new AdvancedTextureSGNode(resources.tree, [new RenderSGNode(makeBillboard())])])])])]);
  root.append(billboard);

  vehicleNode = new TransformationSGNode(mat4.create(), [
      new TransformationSGNode(glm.transform({ translate: [8,0.5,4], scale: 0.5, rotateX : 90, rotateZ : 110 }),  [
      // vehicle, new TransformationSGNode(glm.translate(0,-0.5,0.25), [new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [new RenderSGNode(makeSphere(.1,10,10)) ])])
      vehicle, makeLight(gl,  resources, 0, -0.5, 0.25)
    //  new TransformationSGNode(glm.translate(1,1,10.25) [new RenderSGNode(makePyramid())])
      //new MaterialSGNode([new RenderSGNode(makePyramid())])
      ])
    ]);
  root.append(vehicleNode);

  // main light sources
  root.append(makeLight(gl, resources, 0, 100, 0));
  root.append(makeLight(gl, resources, 0, -100, 0));

  return root;
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

function makeBillboard() {
  var width = 2;
  var height = 2;
  var position = [-width, 0, -height,   width, 0, -height,    width, 0, height,   -width, 0, height, ];
  var normal = [0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1];
  var texturecoordinates = [1, 1,   0, 1,   0, 0,   1, 0];
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

  //setup context and camera matrices
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), 30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  //very primitive camera implementation
  let lookAtMatrix = mat4.lookAt(mat4.create(), vec3(camera.pos.x, camera.pos.y, camera.pos.z), vec3(camera.pos.x, camera.pos.y, 0), vec3(0,1,0));
  let mouseRotateMatrix = mat4.multiply(mat4.create(),
                          glm.rotateX(camera.rotation.y),
                          glm.rotateY(camera.rotation.x));
  context.viewMatrix = mat4.multiply(mat4.create(), lookAtMatrix, mouseRotateMatrix);
  if(camera.pos.z < -15 && !userControlled){
      camera.pos.z = camera.pos.z + zoom;
  }
  else
  {
    userControlled = true;
  }
  pyramidNode.matrix = glm.rotateZ(timeInMilliseconds*-0.01);
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
  		camera.rotation.x -= delta.x;
  		camera.rotation.y -= delta.y;
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
      if (event.code === 'ArrowUp' || event.code === 'KeyW') {
        camera.pos.z = camera.pos.z + zoom;
      }
      else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        camera.pos.z = camera.pos.z - zoom;
      }
      else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        camera.pos.x = camera.pos.x + zoom;
      }
      else if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        camera.pos.x = camera.pos.x - zoom;
      }
    }
  });


}
