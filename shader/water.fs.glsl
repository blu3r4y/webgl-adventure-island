// fragment shader water

precision mediump float;

uniform sampler2D u_reflectTex;
uniform sampler2D u_refractTex;
uniform sampler2D u_dudvTex;

// wave animation
uniform float u_waveOffset;

varying vec2 v_texCoord;
varying vec4 v_clipSpace;
varying vec3 v_cameraVec;

void main (void) {

	// convert to normal device coordiantes by perspective division
	vec2 normalDeviceCoords = v_clipSpace.xy / v_clipSpace.w;

	// convert to texture coordinate system
	vec2 texCoords = normalDeviceCoords / 2.0 + 0.5;

	// reflect (invert y)
	vec2 reflectCoords = vec2(texCoords.x, 1.0 - texCoords.y);
	vec2 refractCoords = texCoords;

	// dudv map http://vandaengine.org/how-to-create-dudv-map-for-water-refraction-with-photoshop-and-tgatodudv-tool/
	// distort with dudv map (convert 0.0 ... 1.0 to -1.0 ... 1.0) and soften distortation effect
	vec2 distort = (texture2D(u_dudvTex, vec2(v_texCoord.x + u_waveOffset, v_texCoord.y).xy * 2.0 - 1.0).rg) * 0.05;
	vec2 distortWave = (texture2D(u_dudvTex, vec2(v_texCoord.x + distort.x, v_texCoord.y - distort.y).xy * 2.0 - 1.0).rg) * 0.01;

	// distort and keep within valid range
	reflectCoords.x = clamp(reflectCoords.x + distortWave.x, 0.0, 1.0);
	reflectCoords.y = clamp(reflectCoords.y + distortWave.x, 0.0, 1.0);
	refractCoords.x = clamp(refractCoords.x + distortWave.x, 0.0, 1.0);
	refractCoords.y = clamp(refractCoords.y + distortWave.x, 0.0, 1.0);

	// map the projected texture
	vec4 reflectColor = texture2D(u_reflectTex, reflectCoords);
	vec4 refractColor = texture2D(u_refractTex, refractCoords);

	// calculate fresnel factor and make water a bit overreflective
	float fresnel = dot(normalize(v_cameraVec), vec3(0., 1., 0.));
	fresnel = pow(fresnel, 3.0);

	// mix reflection and refraction
	gl_FragColor = mix(reflectColor, refractColor, fresnel);
}
