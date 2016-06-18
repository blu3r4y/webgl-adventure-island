/**
 * represents a normal SGNode with the ability to
 * sort all first level child objects before rendering them.
 * the used RenderSGNodes must be TransparentRenderSGNodes in order to work!
 */
class TransparencySGNode extends SGNode {

	constructor(children) {
		super(children);
		this.iniOk = false;
		this.renderNodes = [];
	}

	init() {
		this.iniOk = true;

		for (var i = 0; i < this.children.length; i++) {
			// find the render node and its applied transformations
			let found = this.findRenderNode(this.children[i]);
			this.renderNodes.push(found);
		}
	}

	render(context) {

		if (!this.iniOk) this.init();

		var sortedNodes = [];

		// traverse precalculated children only
		for (let i = 0; i < this.renderNodes.length; i++) {

			let node = this.renderNodes[i].node;

			// apply all scene transformations to this node
			let matrix = mat4.create();
			for (let j = 0; j < this.renderNodes[i].transformations.length; j++) {
				matrix = mat4.multiply(mat4.create(), matrix, this.renderNodes[i].transformations[j].matrix);
			}

			// calculate world space coordinate of reference point
			let refPoint = mat4.multiply(vec4.create(), matrix,
				vec4.fromValues(node.position[0], node.position[1], node.position[2], 1.0));
			// find out distance to camera
			let cameraDist = vec3.distance(vec3.fromValues(refPoint[0], refPoint[1], refPoint[2]),
				vec3.fromValues(camera.istPos.x, camera.istPos.y, camera.istPos.z));

			// add to dictionary
			sortedNodes.push({ distance: cameraDist, node: this.children[i]});
		}

		// order by distance descending
		function compare(a, b) {
			return b.distance - a.distance;
		}
		sortedNodes.sort(compare);

		// render in order
		for (let j = 0; j < sortedNodes.length; j++) {
			sortedNodes[j].node.render(context);
		}
	}

	findRenderNode(node, matrix, transformationNodes) {
		// holds all the transformations which need to be applied to this node
		let transNodes = transformationNodes || [];
		// in a scenario where the scene graph would be changed in runtime we would need
		// to traverse it multiple times and use this matrice all over - we don't do this here
		// because we got a static scene graph (so the matrix result is just for debugging)
		let locMatrix = matrix || mat4.create();

		// recursion anchor
		if (node == null) return null;
		else if (node.constructor.name === "TransparentRenderSGNode") {
			// found final node
			return { node: node, matrix: mat4.clone(locMatrix), transformations: transNodes };
		}
		else if (node.children.length == 0) return null;
		else if (node.constructor.name === "TransformationSGNode") {
			// apply transformations and save node which did this
			locMatrix = mat4.multiply(mat4.create(), locMatrix, node.matrix);
			transNodes.push(node);
		}

		// observe children
		for (let i = 0; i < node.children.length; i++) {
			let found = this.findRenderNode(node.children[i], mat4.clone(locMatrix), transNodes.slice(0));
			if (found != null) return found;
		}
	}
}
