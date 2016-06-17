// vertex shader phong

attribute vec3 a_position;
attribute vec3 a_normal;

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
varying float v_isInLight;
varying float v_verticalPosition;
varying vec3 v_normal;

void main()
{
	vec4 eyePosition = u_modelView * vec4(a_position, 1);
	v_verticalPosition = (u_invView * eyePosition).y;
	// normal vector in eye space
	v_normalVec = u_normalMatrix * a_normal;
	v_normal = a_normal;

	v_eyeVec = -eyePosition.xyz;

	// vector from light surface to viewer in eye space
	v_lightVec = u_lightPos - eyePosition.xyz;
	v_lightSpotVec = u_lightSpotPos - (u_invView * eyePosition).xyz;

	gl_Position = u_projection * eyePosition;
}
