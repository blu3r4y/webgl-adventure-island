// vertex shader water

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

// camera position for fresnel effect
uniform vec3 u_cameraPos;
//inverse view matrix to get from eye to world space
uniform mat3 u_invView;

varying vec2 v_texCoord;
varying vec4 v_clipSpace;
varying vec3 v_cameraVec;

void main()
{
	vec4 eyePosition = u_modelView * vec4(a_position,1);

	// dudv map scaling
	v_texCoord = a_texCoord * 0.5;

	// fresnel effect
	v_cameraVec = normalize(u_cameraPos - (u_invView * eyePosition.xyz));

	// projective texture mapping
	v_clipSpace = u_projection * eyePosition;

	gl_Position = v_clipSpace;
}
