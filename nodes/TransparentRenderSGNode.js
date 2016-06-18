class TransparentRenderSGNode extends SGNode {
	constructor(renderer, children) {
		super(children);

		// precalculate a midpoint as reference for transparency sorting
		let sum = vec3.create();
		let numVertices = renderer.position.length / 3;
		for (let i = 0; i < numVertices; i++)
		{
			let x = renderer.position[i];
			let y = renderer.position[i+1];
			let z = renderer.position[i+2];

			// add up all the vertices positions
			vec3.add(sum, sum, vec3.fromValues(x, y, z));
		}

		// average over all vertices (would propably be near (0,0,0)
		this.position = vec3.scale(vec3.create(), sum, 1.0 / numVertices);

		// proxy a render node
		this.renderNode = new RenderSGNode(renderer, children);
	}

	render(context) {
		this.renderNode.render(context);
	}
}