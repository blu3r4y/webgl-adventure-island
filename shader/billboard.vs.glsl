// Phong Billboard Vertex Shader

attribute vec3 a_position;
attribute vec3 a_normal;
//given texture coordinates per vertex
attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
uniform mat4 u_invView;

uniform vec3 u_lightPos;
uniform vec3 u_lightSpotDir;
uniform vec3 u_lightSpotPos;

//output of this shader
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_lightSpotDir;
varying vec3 v_lightSpotVec;
varying vec3 v_position;

varying vec2 v_texCoord;

void main() {
	vec4 eyePosition = u_modelView * vec4(a_position,1);

	v_position = a_position;

  v_normalVec = u_normalMatrix * a_normal;

  v_eyeVec = -eyePosition.xyz;
	v_lightVec = u_lightPos - eyePosition.xyz;
	v_lightSpotVec = u_lightSpotPos - eyePosition.xyz;
	v_lightSpotDir = u_lightSpotDir;

	v_texCoord = a_texCoord;

	vec4 rotationY = u_modelView[1] * a_position.y;
	gl_Position =  u_projection * (u_modelView * vec4(0.0,0.0,0.0,1.0) + vec4(a_position.x, 0.0, a_position.z, 0.0) + rotationY);
}
