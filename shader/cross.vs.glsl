/* very basic gouraud shading for a simple coordinate cross */

attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

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

Material red = Material(vec4(0.2, 0., 0., 1.),
                        vec4(0.8, 0., 0., 1.),
                        vec4(0.4, 0.4, 0.4, 1.),
                        vec4(0., 0., 0., 0.),
                        0.1);

Material green = Material(vec4(0., 0.2, 0., 1.),
                        vec4(0., 0.8, 0., 1.),
                        vec4(0.4, 0.4, 0.4, 1.),
                        vec4(0., 0., 0., 0.),
                        0.1);

Material blue = Material(vec4(0., 0., 0.2, 1.),
                        vec4(0., 0., 0.8, 1.),
                        vec4(0.4, 0.4, 0.4, 1.),
                        vec4(0., 0., 0., 0.),
                        0.1);

Material neutral = Material(vec4(0.2, 0.2, 0.2, 1.),
                        vec4(0.8, 0.8, 0.8, 1.),
                        vec4(0.4, 0.4, 0.4, 1.),
                        vec4(0., 0., 0., 0.),
                        0.1);

Light light = Light(vec4(0.1, 0.1, 0.1, 1.),
                    vec4(1., 1., 1., 1.),
                    vec4(1., 1., 1., 1.));

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
    vec3 lightVec = vec3(1, 1, 1) - eyePosition.xyz;

    Material material = red;

    if (a_position.y > 2.) material = green;
    else if (a_position.x > 2.) material = blue;
    else if (a_position.z > 2.) material = red;
    else material = neutral;

    v_color = calculateSimplePointLight(light, material, lightVec, normalVec, eyeVec);

    gl_Position = u_projection * eyePosition;
}
