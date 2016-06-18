/**
 * renders a simple texture
 */
class TextureSGNode extends SGNode {

	constructor(texture, textureUnit, children) {
		super(children);
		this.texture = texture;
		this.textureUnit = textureUnit;
	}

	render(context) {
		// grab texture
		gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// set the sampler
		gl.uniform1i(gl.getUniformLocation(context.shader, 'u_tex'), this.textureUnit);

		super.render(context);

		// clean up
		gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
}
