/**
 * sets up parameters for the water shader
 */
class WaterTextureSGNode extends SGNode {
	constructor(reflectTexture, reflectUnit, refractTexture, refractUnit, dudv, camera, children) {
		super(children);
		this.reflectTexture = reflectTexture;
		this.reflectUnit = reflectUnit;
		this.refractTexture = refractTexture;
		this.refractUnit = refractUnit;
		this.dudv = dudv;
		this.dudvId = -1;
		this.dudvUnit = 0;
		this.waveOffset = 0.0;
		this.camera = camera;
	}

	init(gl) {
		// create a texture from an image
		this.dudvId = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.dudvId);

		// enable mipmap filtering if the texture is far away
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

		// repeat the texture
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		// assign the raw image
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.dudv);

		// generate the mipmaps now
		gl.generateMipmap(gl.TEXTURE_2D);

		// enable anisotropic filtering if available
		var ext = (gl.getExtension("EXT_texture_filter_anisotropic")
		|| gl.getExtension("MOZ_EXT_texture_filter_anisotropic")
		|| gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic"));

		if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT));

		// clean up
		gl.bindTexture(gl.TEXTURE_2D, null);
	}


	render(context) {
		if (this.dudvId < 0) this.init(context.gl);

		// reduce to 3x3 matrix since we only process direction vectors (ignore translation)
		let invView3x3 = mat3.fromMat4(mat3.create(), context.invViewMatrix);
		gl.uniformMatrix3fv(gl.getUniformLocation(context.shader, 'u_invView'), false, invView3x3);

		// camera positon for fresnel effect
		gl.uniform3f(gl.getUniformLocation(context.shader, 'u_cameraPos'), this.camera[0], this.camera[1], this.camera[2]);

		// wave movement
		gl.uniform1f(gl.getUniformLocation(context.shader, 'u_waveOffset'), this.waveOffset);

		// reflection texture
		gl.activeTexture(gl.TEXTURE0 + this.reflectUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.reflectTexture);
		gl.uniform1i(gl.getUniformLocation(context.shader, 'u_reflectTex'), this.reflectUnit);

		// refraction texture
		gl.activeTexture(gl.TEXTURE0 + this.refractUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.refractTexture);
		gl.uniform1i(gl.getUniformLocation(context.shader, 'u_refractTex'), this.refractUnit);

		// dudv map texture
		gl.activeTexture(gl.TEXTURE0 + this.dudvUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.dudvId);
		gl.uniform1i(gl.getUniformLocation(context.shader, 'u_dudvTex'), this.dudvUnit);

		super.render(context);

		// clean up
		gl.activeTexture(gl.TEXTURE0 + this.reflectUnit);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.activeTexture(gl.TEXTURE0 + this.refractUnit);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.activeTexture(gl.TEXTURE0 + this.dudvUnit);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
}
