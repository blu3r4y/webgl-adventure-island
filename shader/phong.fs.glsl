// fragment shader phong

precision mediump float;

struct Material
{
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	vec4 emission;
	float shininess;
};

struct Light
{
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
};

uniform Material u_material;
uniform Light u_light;
uniform Light u_lightSpot;
uniform vec3 u_lightSpotDir;

varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_lightSpotVec;
varying vec3 v_lightSpotDir;
varying float v_isInLight;

uniform bool u_enableClipPlane;
uniform vec2 u_simpleClipPlane;
varying float v_verticalPosition;
varying vec3 v_normal;

vec4 simpleLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec)
{
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

	float diffuse = max(dot(normalVec,lightVec),0.0);
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);

	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

	return c_amb + c_diff + c_spec + c_em;
}

vec4 spotLight(Light light, Material material, vec3 lightVec, vec3 dirVec, vec3 normalVec, vec3 normalVecStatic, vec3 eyeVec)
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

	float insideCone = dot(-lightVec, dirVec);

	// https://www.desmos.com/calculator/nmnaud1hrw
	float a = 0.2;
	float b = 0.01;

	vec4 c_spot = vec4(0.0, 0.0, 0.0, 1.0);

	// cone degree
    if (degrees(acos(insideCone)) < 35.0) {
    	// check if some fragment faces exactly against the light source
		float hardShadow = dot(lightVec, normalVecStatic);
		// calculate light attenuation
		float spot = 1.0 / (1.0 + a * distance + b * distance * distance);
		// target color
		c_spot = clamp(spot * light.diffuse * material.diffuse, 0.0, 1.0);
		// check simple hard shadow based on surface normals
		if (hardShadow < 0.0) c_spot *= 0.0;
	}

	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

	return c_amb + c_spot + c_spec + c_em;
}

void main()
{
	// check clipping plane
	if (u_enableClipPlane) if (u_simpleClipPlane.x > 0.0 ? v_verticalPosition < u_simpleClipPlane.y : v_verticalPosition > u_simpleClipPlane.y) discard;

	gl_FragColor = simpleLight(u_light, u_material, v_lightVec, v_normalVec, v_eyeVec)
		+ spotLight(u_lightSpot, u_material, v_lightSpotVec, u_lightSpotDir, v_normalVec, v_normal, v_eyeVec);
}
