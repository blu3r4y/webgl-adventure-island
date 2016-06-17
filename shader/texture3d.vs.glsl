// vertex shader for texture mapping onto complex objects with clipping and spotlight ability

attribute vec3 a_position;
attribute vec3 a_normal;

// given texture coordinates per vertex
attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
uniform mat4 u_invView;
uniform vec3 u_lightPos;
uniform vec3 u_lightSpotPos;
uniform float u_scale;

// output of this shader
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_lightSpotVec;
varying vec3 v_lightSpotDir;
varying vec2 v_texCoord;
varying float v_verticalPosition;
varying vec3 v_normal;

void main()
{
	// vertex point in eye space
	vec4 eyePosition = u_modelView * vec4(a_position,1);
	// y coordinate in world space
	v_verticalPosition = (u_invView * eyePosition).y;
	// normal vector in eye space
	v_normalVec = u_normalMatrix * a_normal;
	v_normal = a_normal;
	// direction vector of the viewer in eye space
	v_eyeVec = -eyePosition.xyz;
	// vector from light surface to viewer in eye space
	v_lightVec = u_lightPos - eyePosition.xyz;
	v_lightSpotVec = u_lightSpotPos - (u_invView * eyePosition).xyz;
	// scale the texture
	v_texCoord = a_position.xz * u_scale;
	// apply projection
	gl_Position = u_projection * eyePosition;
}
