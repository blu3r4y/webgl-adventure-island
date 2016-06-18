/**
 * sets a uniform to insert a clipping plane
 */
class ClippingSGNode extends SGNode {

	constructor(clipPlane, children) {
		super(children);
		this.enableClipping = 0;
		this.clipPlane = clipPlane || vec2.fromValues(1.0, -1.0);
	}

	render(context) {

		gl.uniformMatrix4fv(gl.getUniformLocation(context.shader, 'u_invView'), false, context.invViewMatrix);

		let u_enable = gl.getUniformLocation(context.shader, "u_enableClipPlane");
		if (u_enable) gl.uniform1i(u_enable, this.enableClipping);

		let u_coords = gl.getUniformLocation(context.shader, "u_simpleClipPlane");
		if (u_coords) gl.uniform2f(u_coords, this.clipPlane[0], this.clipPlane[1]);

		super.render(context);
	}
}
