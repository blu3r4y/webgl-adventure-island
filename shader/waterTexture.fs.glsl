/**
 * a phong shader implementation with texture support
 */
precision mediump float;

//texture related variables
varying vec2 v_texCoord;
varying vec4 v_clipSpace;

uniform sampler2D u_reflectTex;
uniform sampler2D u_refractTex;
uniform sampler2D u_dudvTex;

uniform float u_waveOffset;

varying vec3 v_cameraVec;

void main (void) {
	// convert to normal device coordiantes by perspective division
	vec2 normalDeviceCoords = v_clipSpace.xy / v_clipSpace.w;
	// convert to texture coordinate system
	normalDeviceCoords = normalDeviceCoords/2.0 + 0.5;

	// reflect (invert y)
	vec2 reflectCoords = vec2(normalDeviceCoords.x, 1.0 - normalDeviceCoords.y);
	vec2 refractCoords = normalDeviceCoords;

	// dudv map http://vandaengine.org/how-to-create-dudv-map-for-water-refraction-with-photoshop-and-tgatodudv-tool/
	// distort with dudv map (convert 0.0-1.0 to -1.0-1.0)
	// soften distortation effect
	vec2 distort = (texture2D(u_dudvTex, vec2(v_texCoord.x + u_waveOffset, v_texCoord.y).xy * 2.0 - 1.0).rg) * 0.05;
	vec2 distortWave = (texture2D(u_dudvTex, vec2(v_texCoord.x + distort.x, v_texCoord.y - distort.y).xy * 2.0 - 1.0).rg) * 0.01;

	vec2 distortFinal = distortWave;

	// distort and keep within valid range
	reflectCoords.x = clamp(reflectCoords.x + distortFinal.x, 0.0, 1.0);
	reflectCoords.y = clamp(reflectCoords.y + distortFinal.x, 0.0, 1.0);

	refractCoords.x = clamp(refractCoords.x + distortFinal.x, 0.0, 1.0);
	refractCoords.y = clamp(refractCoords.y + distortFinal.x, 0.0, 1.0);

	vec4 reflectColor = texture2D(u_reflectTex, reflectCoords);
	vec4 refractColor = texture2D(u_refractTex, refractCoords);


	float fresnel = dot(normalize(v_cameraVec), vec3(0., 1., 0.));
	// make water more reflective
	fresnel = pow(fresnel, 2.0);

	gl_FragColor = mix(reflectColor, refractColor, fresnel);
	//gl_FragColor = mix(vec4(1.,0.,0.,1.), vec4(0.,1.,0.,1.), fresnel);

	//gl_FragColor = texture2D(u_tex, v_texCoord);
}
