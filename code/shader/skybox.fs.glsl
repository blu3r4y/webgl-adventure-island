// fragment shader for skybox

precision mediump float;

// skybox
uniform samplerCube u_texSkybox;

// ray from camera to skymap
varying vec3 v_cameraRayVec;

void main() {

	// normalize the vector
	vec3 cameraRayVec = normalize(v_cameraRayVec);

	// lookup in texture cube
	gl_FragColor = textureCube(u_texSkybox, cameraRayVec);
}
