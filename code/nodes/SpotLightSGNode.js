/**
 * sets up a spotlight
 */
class SpotLightSGNode extends TransformationSGNode {

	constructor(position, direction, children) {
		super(children);
		this.position = position || [0, 0, 0];
		this.direction = direction || [1, 0, 0];
		this.ambient = [0, 0, 0, 1];
		this.diffuse = [1, 1, 1, 1];
		this.specular = [1, 1, 1, 1];
		this.uniform = 'u_lightSpot';

		this._worldPosition = null;
	}

	setLightUniforms(context) {
		const gl = context.gl;
		//no materials in use
		if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform + '.ambient'))) {
			return;
		}
		gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform + '.ambient'), this.ambient);
		gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform + '.diffuse'), this.diffuse);
		gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform + '.specular'), this.specular);
	}

	setLightPosition(context) {
		const gl = context.gl;
		if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform + 'Pos'))) {
			return;
		}
		const position = this._worldPosition || this.position;
		gl.uniform3f(gl.getUniformLocation(context.shader, this.uniform + 'Pos'), position[0], position[1], position[2]);
		gl.uniform3f(gl.getUniformLocation(context.shader, this.uniform + 'Dir'), this.direction[0], this.direction[1], this.direction[2]);
	}

	/**
	 * set the light uniforms without updating the last light position
	 */
	setLight(context) {
		this.setLightPosition(context);
		this.setLightUniforms(context);
	}

	render(context) {
		this.setLight(context);

		//since this a transformation node update the matrix according to my position
		this.matrix = glm.translate(this.position[0], this.position[1], this.position[2]);

		//render children
		super.render(context);
	}
}
