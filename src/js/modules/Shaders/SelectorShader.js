
let vertexSelectorShader = `/*glsl*/
varying vec3 vp;

void main() {
  vp = ${ATTR_POSITION};
  gl_Position = ${U_PROJECTIONMATRIX} * ${U_VIEWMATRIX} * ${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0);
}
`;

let fragmentSelectorShader = `/*glsl*/
uniform float ${U_TIME};
uniform float ${U_VARIANT};
varying vec3 vp;

void main() {
  float ts = ${U_TIME} * (${U_VARIANT} + 1.0);
  float x = abs(2.*fract(.5 * vp.x + ts)-1.);
  float y = abs(2.*fract(.5 * vp.y + 0.33 + ts)-1.);
  float z = abs(2.*fract(.5 * vp.z + 0.66 + ts)-1.);
  float a = x * y * z;
  gl_FragColor = vec4(1.,1.,1., a * (a + 1.0));
}
`;

let SelectorShader = new ShaderProgram(vertexSelectorShader, fragmentSelectorShader);
