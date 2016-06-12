/* works just like AdvancedTextureSGNode except that it uses mipmapping to reduce texture flickering noise.
* furthermore for texture3d shaders you can supply a scale factor which defines how the texture should be scaled onto the object */

class FilterTextureSGNode extends SGNode {
    constructor(image, scale, children ) {
        super(children);
        this.image = image;
        this.textureunit = 0;
        this.uniform = 'u_tex';
        this.textureId = -1;
        this.scale = scale || 1.0;
    }

    init(gl) {
        this.textureId = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.textureId);

        // enable mipmaps
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter || gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter || gl.LINEAR_MIPMAP_LINEAR);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS || gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT || gl.REPEAT);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

        // mipmap needed for mimap filter
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    render(context) {
        if (this.textureId < 0) {
            this.init(context.gl);
        }

        gl.uniform1f(gl.getUniformLocation(context.shader, "u_scale"), this.scale);

        //set additional shader parameters
        gl.uniform1i(gl.getUniformLocation(context.shader, this.uniform), this.textureunit);

        //activate and bind texture
        gl.activeTexture(gl.TEXTURE0 + this.textureunit);
        gl.bindTexture(gl.TEXTURE_2D, this.textureId);


        // used for antistropic filtering
        /*var textureSizeLocation = gl.getUniformLocation(context.shader, "u_textureSize");

        gl.uniform2f(textureSizeLocation, this.image.width, this.image.height);

        var kernelLocation = gl.getUniformLocation(context.shader, "u_kernel[0]");
        var kernelWeightLocation = gl.getUniformLocation(context.shader, "u_kernelWeight");

        function computeKernelWeight(kernel) {
            var weight = kernel.reduce(function(prev, curr) {
                return prev + curr;
            });
            return weight <= 0 ? 1 : weight;
        }

        var gaussianBlur = [
            0.045, 0.122, 0.045,
            0.122, 0.332, 0.122,
            0.045, 0.122, 0.045
        ];
        gl.uniform1fv(kernelLocation, gaussianBlur);
        gl.uniform1f(kernelWeightLocation, computeKernelWeight(gaussianBlur));*/

        //render children
        super.render(context);

        //clean up
        gl.activeTexture(gl.TEXTURE0 + this.textureunit);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }


}
