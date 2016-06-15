/* lab framework phong shader
 * by Samuel Gratzl
 */

attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

uniform vec3 u_lightPos;
uniform vec3 u_lightSpotDir;
uniform vec3 u_lightSpotPos;

// output of this shader
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_lightSpotDir;
varying vec3 v_lightSpotVec;
varying float v_isInLight;

void main()
{
	vec4 eyePosition = u_modelView * vec4(a_position, 1);
	v_normalVec = u_normalMatrix * a_normal;
	v_eyeVec = -eyePosition.xyz;
	v_lightVec = u_lightPos - eyePosition.xyz;
	v_lightSpotVec = u_lightSpotPos - eyePosition.xyz;
	v_lightSpotDir = u_lightSpotDir;

	gl_Position = u_projection * eyePosition;
}
