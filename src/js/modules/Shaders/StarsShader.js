
let vertexStarsShader = `/*glsl*/
varying vec3 vp;

void main() {
  vp = (${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0)).xyz;

  gl_Position = ${U_PROJECTIONMATRIX} * ${U_VIEWMATRIX} * ${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0);
}
`;

let fragmentStarsShader = `/*glsl*/
uniform sampler2D ${U_TEXTURE_STARS};

varying vec3 vp;

void main() {
  vec4 d = texture2D(${U_TEXTURE_STARS}, vp.xy * 0.211);
  gl_FragColor = vec4(vec3(1.0), d.r * d.g);
}
`;

let StarsShader = new ShaderProgram(vertexStarsShader, fragmentStarsShader);
