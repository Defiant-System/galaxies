
let vertexStarfieldShader = `/*glsl*/
varying vec2 uv;
varying vec3 vp;

void main() {
  uv = ${ATTR_POSITION}.xy * 0.5 + 0.5;
  vp = ${ATTR_POSITION};
  gl_Position = ${U_PROJECTIONMATRIX} * ${U_VIEWMATRIX} * ${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0);
}
`;

let fragmentStarfieldShader = `/*glsl*/
uniform float ${U_TIME};
varying vec2 uv;
varying vec3 vp;

void main() {
  float iTime = ${U_TIME};
  
  // Normalized pixel coordinates (from 0 to 1)
  vec2 wp = uv.xy/vp.xy;

  // Time varying pixel color
  vec3 col = 0.5 + 0.5 * cos(iTime + wp.xyx + vec3(0,2,4));

  gl_FragColor = vec4(col,.25);
}
`;

let StarfieldShader = new ShaderProgram(vertexStarfieldShader, fragmentStarfieldShader);
