/**
 * a phong shader implementation with texture support
 */
precision mediump float;

//texture related variables
//varying vec2 v_texCoord;
varying vec4 v_clipSpace;

uniform sampler2D u_reflectTex;
uniform sampler2D u_refractTex;

void main (void) {

// convert to normal device coordiantes by perspective division
        vec2 normalDeviceCoords = v_clipSpace.xy / v_clipSpace.w;
        vec2 normalDeviceCoordsInvert = vec2(v_clipSpace.x, -v_clipSpace.y) / v_clipSpace.w;
        // convert to texture coordinate system
        normalDeviceCoords = normalDeviceCoords/2.0 + 0.5;
        normalDeviceCoordsInvert = normalDeviceCoordsInvert/2.0 + 0.5;

// reflect (invert y)
		vec4 reflectColor = texture2D(u_reflectTex, vec2(normalDeviceCoords.x, normalDeviceCoordsInvert.y));
		vec4 refractColor = texture2D(u_refractTex, normalDeviceCoords);

        //gl_FragColor = reflectColor;
        gl_FragColor = mix(reflectColor, refractColor, 0.5);

		//gl_FragColor = texture2D(u_tex, v_texCoord);
}
