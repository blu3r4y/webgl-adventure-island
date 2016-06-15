//a scene graph node for setting texture parameters
class WaterTextureSGNode extends SGNode {
  constructor(reflectTexture, reflectUnit, refractTexture, refractUnit, dudv, camera, children ) {
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

    this.dudvId = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.dudvId);

    // enable mipmaps
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter || gl.LINEAR_MIPMAP_LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS || gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT || gl.REPEAT);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.dudv);

    // mipmap needed for mimap filter
    gl.generateMipmap(gl.TEXTURE_2D);

    // enable anisotropic filtering
    var ext = gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
    var max_anisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max_anisotropy);

    gl.bindTexture(gl.TEXTURE_2D, null);
}


render(context) {
    if (this.dudvId < 0) {
        this.init(context.gl);
    }
    let invView3x3 = mat3.fromMat4(mat3.create(), context.invViewMatrix); //reduce to 3x3 matrix since we only process direction vectors (ignore translation)
    gl.uniformMatrix3fv(gl.getUniformLocation(context.shader, 'u_invView'), false, invView3x3);

    gl.uniform3f(gl.getUniformLocation(context.shader, 'u_camerPos'), this.camera[0], this.camera[1], this.camera[2]);


        gl.uniform1f(gl.getUniformLocation(context.shader, 'u_waveOffset'), this.waveOffset);

      gl.activeTexture(gl.TEXTURE0 + this.reflectUnit);
      gl.bindTexture(gl.TEXTURE_2D, this.reflectTexture);
      gl.uniform1i(gl.getUniformLocation(context.shader, 'u_reflectTex'), this.reflectUnit);


      gl.activeTexture(gl.TEXTURE0 + this.refractUnit);
      gl.bindTexture(gl.TEXTURE_2D, this.refractTexture);
      gl.uniform1i(gl.getUniformLocation(context.shader, 'u_refractTex'), this.refractUnit);

        gl.activeTexture(gl.TEXTURE0 + this.dudvUnit);
        gl.bindTexture(gl.TEXTURE_2D, this.dudvId);
        gl.uniform1i(gl.getUniformLocation(context.shader, 'u_dudvTex'), this.dudvUnit);

      //render children
      super.render(context);

      gl.activeTexture(gl.TEXTURE0 + this.reflectUnit);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE0 + this.refractUnit);
      gl.bindTexture(gl.TEXTURE_2D, null);

  }
}
