/**
 * a phong shader implementation with texture support
 */
precision mediump float;

/**
 * definition of a material structure containing common properties
 */
struct Material {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	vec4 emission;
	float shininess;
};

/**
 * definition of the light properties related to material properties
 */
struct Light {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
};

// antistropic filtering stuff (not used!!)
//uniform vec2 u_textureSize;
//uniform float u_kernel[9];
//uniform float u_kernelWeight;

//illumination related variables
uniform Material u_material;
uniform Light u_light;
uniform Light u_lightSpot;
uniform vec3 u_lightSpotDir;
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_lightSpotVec;
varying vec3 v_lightSpotDir;

//texture related variables
uniform sampler2D u_tex;
varying vec2 v_texCoord;

uniform bool u_enableClipPlane;
uniform vec2 u_simpleClipPlane;
varying vec3 v_position;
varying vec3 v_normal;

vec4 simpleLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec, vec4 textureColor) {
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

	//compute diffuse term
	float diffuse = max(dot(normalVec,lightVec),0.0);

	//compute specular term
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);

	material.diffuse = textureColor;
	material.ambient = textureColor;

	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

	return vec4((c_amb + c_diff + c_spec + c_em).xyz, textureColor.a);
}

vec4 spotLight(Light light, Material material, vec3 lightVec, vec3 dirVec, vec3 normalVec, vec3 normalVecStatic, vec3 eyeVec, vec4 textureColor)
{
	float distance = length(lightVec);

	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	normalVecStatic = normalize(normalVecStatic);
	eyeVec = normalize(eyeVec);
	dirVec = normalize(dirVec);

	// compute diffuse term
	float diffuse = max(dot(normalVec,lightVec),0.0);

	// compute specular term
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);

	material.diffuse = textureColor;
	material.ambient = textureColor;

	float insideCone = dot(-lightVec, dirVec);

	// https://www.desmos.com/calculator/nmnaud1hrw
	float a = 9.0;
	float b = 0.05;

	vec4 c_spot = vec4(0.0, 0.0, 0.0, 1.0);

	// cone degree
	float deg = degrees(acos(insideCone));
	float spot = 0.0;
    if (deg < 35.0) {
    	a = a * pow(deg/35.0, 5.0);
    	// check if some fragment faces exactly against the light source
		float hardShadow = dot(lightVec, normalVecStatic);
		// calculate light attenuation
		spot = clamp(1.0 / (1.0 + a * distance + b * distance * distance), 0.0, 1.0);
		// check simple hard shadow based on surface normals
		if (hardShadow < 0.0) spot = 0.0;
		// target color
		c_spot = clamp(spot * light.diffuse * material.diffuse, 0.0, 1.0);
	}

	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

	return vec4((mix(c_spot, c_amb + c_spec + c_em, spot)).xyz, textureColor.a);
}

void main (void) {
	vec4 textureColor = texture2D(u_tex, v_texCoord);

	gl_FragColor = simpleLight(u_light, u_material, v_lightVec, v_normalVec, v_eyeVec, textureColor)
		+ spotLight(u_lightSpot, u_material, v_lightSpotVec, u_lightSpotDir, v_normalVec, v_normal, v_eyeVec, textureColor);
}
