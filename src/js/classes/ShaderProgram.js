
let currentProgram;


function createShader (type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	// <dev-only>
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.warn(source.split('\n').map((line, index) => `${index+1} ${line}`).join('\n'));
		throw new Error('compile error: ' + gl.getShaderInfoLog(shader));
	}
	// </dev-only>
	return shader;
}


class ShaderProgram {
	constructor (vertexSource, fragmentSource) {

		let vertexShaderHeader = `/*glsl*/
attribute vec3 ${ATTR_POSITION};
uniform mat4 ${U_MODELMATRIX};
uniform mat4 ${U_VIEWMATRIX};
uniform mat4 ${U_PROJECTIONMATRIX};
`;

let fragmentShaderHeader = `/*glsl*/
precision highp float;
${common}
`;

		this.program = gl.createProgram();
		gl.attachShader(this.program, createShader(gl.VERTEX_SHADER, vertexShaderHeader + vertexSource));
		gl.attachShader(this.program, createShader(gl.FRAGMENT_SHADER, fragmentShaderHeader + fragmentSource));
		gl.linkProgram(this.program);

		// <dev-only>
		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			throw new Error('link error: ' + gl.getProgramInfoLog(this.program));
		}
		// </dev-only>

		this.uniformLocations = {};
		let numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < numUniforms; i++) {
			let uniform = gl.getActiveUniform(this.program, i);
			this.uniformLocations[uniform.name] = gl.getUniformLocation(this.program, uniform.name);
		}
	}

	use (uniforms = {}) {
		currentProgram = this.program;
		uniforms[U_PROJECTIONMATRIX] = TheCamera.projectionMatrix;
		uniforms[U_VIEWMATRIX] = TheCamera.viewMatrix;

		gl.useProgram(this.program);
		for (let uniformName in uniforms) {
			let location = this.uniformLocations[uniformName];
			if (uniforms[uniformName] instanceof Vector3) gl.uniform3fv(location, uniforms[uniformName].array());
			else if (uniforms[uniformName] instanceof Vector2) gl.uniform2fv(location, uniforms[uniformName].array());
			else if (uniforms[uniformName] instanceof Vector4) gl.uniform4fv(location, uniforms[uniformName].array());
			else if (uniforms[uniformName] instanceof Matrix3) gl.uniformMatrix3fv(location, false, uniforms[uniformName].els);
			else if (uniforms[uniformName] instanceof Matrix4) gl.uniformMatrix4fv(location, false, uniforms[uniformName].els);
			else if (uniforms[uniformName].texture) {
				let slot = uniforms[uniformName].slot || 0;
				uniforms[uniformName].texture.use(slot);
				gl.uniform1i(location, slot);
			} else {
				gl.uniform1f(location, uniforms[uniformName]);
			}
		}
	}
}
