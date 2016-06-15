attribute vec3 a_position;
attribute vec3 a_normal;

// given texture coordinates per vertex
attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
uniform mat4 u_invView;

uniform vec3 u_lightPos;
uniform vec3 u_lightSpotPos;
uniform vec3 u_lightSpotDir;

// output of this shader
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
varying vec3 v_lightSpotVec;
varying vec3 v_lightSpotDir;

varying vec2 v_texCoord;

// texture scaling factor
uniform float u_scale;

varying vec3 v_position;

void main()
{
    vec4 eyePosition = u_modelView * vec4(a_position,1);
    v_position = a_position;
    v_normalVec = u_normalMatrix * a_normal;
    v_eyeVec = -eyePosition.xyz;
    v_lightVec = u_lightPos - eyePosition.xyz;
    v_lightSpotVec = u_lightSpotPos - eyePosition.xyz;
    v_lightSpotDir = u_lightSpotDir;

    // basic projection
    v_texCoord = a_position.xz * u_scale;

    gl_Position = u_projection * eyePosition;
}
