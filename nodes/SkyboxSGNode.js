/**
 * node which sets up skybox parameters
 */
class SkyboxSGNode extends SGNode {

	constructor(texture, textureUnit, children) {
		super(children);
		this.texture = texture;
		this.textureUnit = textureUnit;
	}

	render(context) {
		// reduce to 3x3 matrix since we only process direction vectors (ignore translation)
		let invView3x3 = mat3.fromMat4(mat3.create(), context.invViewMatrix);
		gl.uniformMatrix3fv(gl.getUniformLocation(context.shader, 'u_invView'), false, invView3x3);
		gl.uniform1i(gl.getUniformLocation(context.shader, 'u_texSkybox'), this.textureUnit);

		// grab texture
		gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);

		super.render(context);

		// clean up
		gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	}
}