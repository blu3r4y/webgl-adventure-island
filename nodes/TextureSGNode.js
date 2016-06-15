//a scene graph node for setting texture parameters
class TextureSGNode extends SGNode {
	constructor(texture, unit, children) {
		super(children);
		this.texture = texture;
		this.textureunit = unit || 0;
	}

	render(context) {

		gl.activeTexture(gl.TEXTURE0 + this.textureunit);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		//set additional shader parameters
		gl.uniform1i(gl.getUniformLocation(context.shader, 'u_tex'), this.textureunit);

		//render children
		super.render(context);

		gl.activeTexture(gl.TEXTURE0 + this.textureunit);
		gl.bindTexture(gl.TEXTURE_2D, null);


		/*
		 // basic texture

		 var localTexture = gl.createTexture();
		 console.log(localTexture);
		 gl.activeTexture(gl.TEXTURE0 + this.textureunit);
		 gl.bindTexture(gl.TEXTURE_2D, localTexture);

		 gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
		 new Uint8Array([255, 0, 0, 255,
		 0, 255, 0, 255,
		 0, 0, 255, 255,
		 255, 255, 0, 255]));

		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);


		 super.render(context);

		 gl.activeTexture(gl.TEXTURE0 + this.textureunit);
		 gl.bindTexture(gl.TEXTURE_2D, null);
		 */
	}
}
