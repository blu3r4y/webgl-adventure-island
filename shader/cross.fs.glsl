/* simple coordinate cross shading only works per vertex */

precision mediump float;

varying vec4 v_color;

void main()
{
	gl_FragColor = v_color;
}
