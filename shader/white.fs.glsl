// fragment shader white monocolor

precision mediump float;

uniform bool u_enableClipPlane;
uniform vec2 u_simpleClipPlane;
varying float v_verticalPosition;

void main()
{
	// check clipping plane
	if (u_enableClipPlane) if (u_simpleClipPlane.x > 0.0 ? v_verticalPosition < u_simpleClipPlane.y : v_verticalPosition > u_simpleClipPlane.y) discard;

	gl_FragColor = vec4(1,1,1,1);
}
