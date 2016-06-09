/* lab framework gouraud shader
 * by Samuel Gratzl
 */

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

attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

uniform vec3 u_lightPos;

uniform Material u_material;
uniform Light u_light;

varying vec4 v_color;

vec4 calculateSimplePointLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec)
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

void main()
{
    vec4 eyePosition = u_modelView * vec4(a_position,1);
    vec3 normalVec = u_normalMatrix * a_normal;
    vec3 eyeVec = -eyePosition.xyz;
    vec3 lightVec = u_lightPos - eyePosition.xyz;
    vec3 light2Vec = u_light2Pos - eyePosition.xyz;

    v_color = calculateSimplePointLight(u_light, u_material, lightVec, normalVec, eyeVec);

    gl_Position = u_projection * eyePosition;
}
