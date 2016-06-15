'use strict';

// skybox texture
var envcubetexture;

// active cubemap day = 0, night = 1
var activeCubeMap = 0;

function initSkybox(resources) {
	//create the texture
	envcubetexture = gl.createTexture();
	//define some texture unit we want to work on
	gl.activeTexture(gl.TEXTURE0);
	//bind the texture to the texture unit
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, envcubetexture);
	//set sampling parameters
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	//gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.MIRRORED_REPEAT); //will be available in WebGL 2
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	//set correct image for each side of the cube map
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_night_pos_x);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_night_neg_x);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_night_pos_y);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_night_neg_y);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_night_pos_z);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources.env_night_neg_z);
	//generate mipmaps (optional)
	gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

	// enable anisotropic filtering if available
	var ext = (gl.getExtension("EXT_texture_filter_anisotropic")
	|| gl.getExtension("MOZ_EXT_texture_filter_anisotropic")
	|| gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic"));

	if (ext) gl.texParameterf(gl.TEXTURE_CUBE_MAP, ext.TEXTURE_MAX_ANISOTROPY_EXT, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT));

	//unbind the texture again
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

	activeCubeMap = 1;
}

function toggleCubeMapTexture(type) {
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, envcubetexture);

	if (type === 0) {
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_pos_x);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_neg_x);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_pos_y);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_neg_y);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_pos_z);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_day_neg_z);
	}
	else {
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_pos_x);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_neg_x);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_pos_y);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_neg_y);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_pos_z);
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resourcesGlobal.env_night_neg_z);
	}

	gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

	activeCubeMap = type;
}