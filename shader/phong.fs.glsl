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

varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_lightSpotVec;
varying vec3 v_lightSpotDir;
varying float v_isInLight;

uniform bool u_enableClipPlane;
uniform vec2 u_simpleClipPlane;
varying float v_verticalPosition;

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

vec4 spotLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec)
{
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

	if(dot(-lightVec,D) > spotCutoffCosine) {
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

void main()
{
	// check clipping plane
	if (u_enableClipPlane) if (u_simpleClipPlane.x > 0.0 ? v_verticalPosition < u_simpleClipPlane.y : v_verticalPosition > u_simpleClipPlane.y) discard;

	gl_FragColor = simpleLight(u_light, u_material, v_lightVec, v_normalVec, v_eyeVec)
		+ spotLight(u_lightSpot, u_material, v_lightSpotVec, v_normalVec, v_eyeVec);
}
