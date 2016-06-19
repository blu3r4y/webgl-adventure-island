// vertex shader for billboards with phong shading

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
uniform mat4 u_invView;

uniform vec3 u_lightPos;
uniform vec3 u_lightSpotPos;

varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_lightSpotDir;
varying vec3 v_lightSpotVec;
varying vec3 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;

void main() {
	vec4 rotationY = u_modelView[1] * a_position.y;
	//nomal eye position
	//vec4 eyePosition = u_modelView * vec4(a_position, 1.0);
	//"Adapted" eyeposition - not changing anything though
	vec4 eyePosition = u_modelView * vec4(0.0,0.0,0.0,1.0) + vec4(a_position.x, 0.0, a_position.z, 0.0) + rotationY;

	v_position = a_position;

	// normal vector in eye space
	v_normalVec = u_normalMatrix * a_normal;
	v_normal = a_normal;

	v_eyeVec = -eyePosition.xyz;

	// vector from light surface to viewer in eye space
	v_lightVec = u_lightPos - eyePosition.xyz;
	v_lightSpotVec = u_lightSpotPos - (u_invView * eyePosition).xyz;

	v_texCoord = a_texCoord;


	gl_Position =  u_projection * (u_modelView * vec4(0.0,0.0,0.0,1.0) + vec4(a_position.x, 0.0, a_position.z, 0.0) + rotationY);
}
