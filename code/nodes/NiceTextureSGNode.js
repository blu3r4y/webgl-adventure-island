/**
 * works just like AdvancedTextureSGNode except that it uses mipmapping
 * and anisotropic filtering to reduce texture flickering noise.
 *
 * furthermore for texture3d shaders you can supply a scale factor
 * which defines how large texture should be scaled onto the object.
 */
class NiceTextureSGNode extends SGNode {

	constructor(image, scale, children) {
		super(children);
		this.image = image;
		this.textureunit = 0;
		this.uniform = 'u_tex';
		this.textureId = -1;
		this.scale = scale;
	}

	init(gl) {
		// create a texture from an image
		this.textureId = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + this.textureunit);
		gl.bindTexture(gl.TEXTURE_2D, this.textureId);

		// enable mipmap filtering if the texture is far away
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

		// repeat the texture
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		// assign the raw image
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

		// generate the mipmaps now
		gl.generateMipmap(gl.TEXTURE_2D);

		// enable anisotropic filtering if available
		var ext = (gl.getExtension("EXT_texture_filter_anisotropic")
			|| gl.getExtension("MOZ_EXT_texture_filter_anisotropic")
			|| gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic"));

		if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT));

		// clean up
		gl.activeTexture(gl.TEXTURE0 + this.textureunit);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	render(context) {
		if (this.textureId < 0) this.init(context.gl);

		gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_invView'), false, context.invViewMatrix);
		gl.uniform1f(gl.getUniformLocation(context.shader, "u_scale"), this.scale);
		gl.uniform1i(gl.getUniformLocation(context.shader, this.uniform), this.textureunit);

		// grab texture
		gl.activeTexture(gl.TEXTURE0 + this.textureunit);
		gl.bindTexture(gl.TEXTURE_2D, this.textureId);

		super.render(context);

		// clean up
		gl.activeTexture(gl.TEXTURE0 + this.textureunit);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
}
