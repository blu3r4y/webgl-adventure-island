/* lab framework gouraud shader
 * by Samuel Gratzl
 */

precision mediump float;

varying vec4 v_color;

void main()
{
    gl_FragColor = v_color;
}
