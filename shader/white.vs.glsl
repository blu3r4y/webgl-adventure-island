// vertex shader white monocolor

attribute vec3 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
uniform mat4 u_invView;

varying float v_verticalPosition;

void main()
{
	vec4 eyePosition = u_modelView * vec4(a_position,1);
	v_verticalPosition = (u_invView * eyePosition).y;

	gl_Position = u_projection * eyePosition;
}
