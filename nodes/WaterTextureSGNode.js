//a scene graph node for setting texture parameters
class WaterTextureSGNode extends SGNode {
  constructor(reflectTexture, reflectUnit, refractTexture, refractUnit, children ) {
      super(children);
      this.reflectTexture = reflectTexture;
      this.reflectUnit = reflectUnit;
      this.refractTexture = refractTexture;
      this.refractUnit = refractUnit;
  }

  render(context)
  {
      gl.activeTexture(gl.TEXTURE0 + this.reflectUnit);
      gl.bindTexture(gl.TEXTURE_2D, this.reflectTexture);
      gl.uniform1i(gl.getUniformLocation(context.shader, 'u_reflectTex'), this.reflectUnit);


      gl.activeTexture(gl.TEXTURE0 + this.refractUnit);
      gl.bindTexture(gl.TEXTURE_2D, this.refractTexture);
      gl.uniform1i(gl.getUniformLocation(context.shader, 'u_refractTex'), this.refractUnit);

      //render children
      super.render(context);

      gl.activeTexture(gl.TEXTURE0 + this.reflectUnit);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE0 + this.refractUnit);
      gl.bindTexture(gl.TEXTURE_2D, null);

  }
}
