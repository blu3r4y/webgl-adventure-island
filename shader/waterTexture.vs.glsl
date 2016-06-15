attribute vec3 a_position;
attribute vec3 a_normal;

// given texture coordinates per vertex
attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

uniform vec3 u_cameraPos;

varying vec2 v_texCoord;
varying vec4 v_clipSpace;

varying vec3 v_cameraVec;

//inverse view matrix to get from eye to world space
uniform mat3 u_invView;

void main()
{
	vec4 eyePosition = u_modelView * vec4(a_position,1);
	//v_normalVec = u_normalMatrix * a_normal;
	//v_eyeVec = -eyePosition.xyz;

	// basic projection
	v_texCoord = a_texCoord * 0.5;

	// fresnel effect
	v_cameraVec = normalize(u_cameraPos - (u_invView * eyePosition.xyz));

	v_clipSpace = u_projection * eyePosition;
	gl_Position = v_clipSpace;
}
