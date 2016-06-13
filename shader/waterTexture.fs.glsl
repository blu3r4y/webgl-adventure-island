/**
 * a phong shader implementation with texture support
 */
precision mediump float;

//texture related variables
uniform sampler2D u_tex;
varying vec2 v_texCoord;

void main (void) {

		gl_FragColor = texture2D(u_tex, v_texCoord);
}
