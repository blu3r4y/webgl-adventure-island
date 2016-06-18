// vertex shader for skybox

attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

// inverse view matrix to get from eye to world space
uniform mat3 u_invView;

// ray from camera to skymap
varying vec3 v_cameraRayVec;

void main() {

	// calculate vertex position in eye space (vertex position in eye space = camera ray in eye space)
	vec4 eyePosition = u_modelView * vec4(a_position,1);

	// transform camera ray direction to world space
	v_cameraRayVec = u_invView * eyePosition.xyz;

	// output
	gl_Position = u_projection * eyePosition;
}
