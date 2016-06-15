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

vec4 calculateSimplePointLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec, vec4 textureColor) {
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

	return c_amb + c_diff + c_spec + c_em;
}

vec4 calculateSpotPointLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec, vec4 textureColor) {
	material.diffuse = textureColor;
	material.ambient = textureColor;
	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 res = c_amb;
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);
	vec3 D = normalize(v_lightSpotDir);

	float diffuse = max(dot(normalVec,lightVec),0.0);
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);

	float spotCutoffCosine = 0.6;

	if (dot(-lightVec,D) > spotCutoffCosine) {
		float diffuse = max(dot(normalVec,lightVec),0.0);
		if(diffuse > 0.0) {
			res += clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
			vec3 reflectVec = reflect(-lightVec,normalVec);
			float spec = pow( max(dot(reflectVec, eyeVec),0.0) , material.shininess);

			res += clamp(spec * light.specular * material.specular, 0.0, 1.0);
		}
	}

	return res;
}

void main (void) {
	vec4 textureColor = texture2D(u_tex, v_texCoord);

	if (textureColor.a < 0.5) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
	}
	else {
		gl_FragColor = calculateSimplePointLight(u_light, u_material, v_lightVec, v_normalVec, v_eyeVec, textureColor)
			+ calculateSpotPointLight(u_lightSpot, u_material, v_lightSpotVec, v_normalVec, v_eyeVec, textureColor);
	}
}
