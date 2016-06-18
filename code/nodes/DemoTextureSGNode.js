/**
 * renders a demo texture
 */
class DemoTextureSGNode extends SGNode {

	constructor(textureUnit, children) {
		super(children);
		this.textureId = -1;
		this.textureUnit = textureUnit;
	}

	init(gl) {
		// create a texture from an image
		this.textureId = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.textureId);

		// load a simple demo texture
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
			new Uint8Array([255, 0, 0, 255,
				0, 255, 0, 255,
				0, 0, 255, 255,
				255, 255, 0, 255]));

		// simple nearest neighbour filter
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		// clean up
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	render(context) {
		if (this.textureId < 0) this.init(context.gl);

		// grab texture
		gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.textureId);

		// set the sampler
		gl.uniform1i(gl.getUniformLocation(context.shader, 'u_tex'), this.textureUnit);

		super.render(context);

		// clean up
		gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
}
