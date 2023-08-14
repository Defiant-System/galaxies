
let vertexStarfieldShader = `/*glsl*/
varying vec3 vp;

void main() {
	vp = (${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0)).xyz;

	gl_Position = ${U_PROJECTIONMATRIX} * ${U_VIEWMATRIX} * ${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0);
}
`;

let fragmentStarfieldShader = `/*glsl*/
uniform float ${U_TIME};
varying vec3 vp;

float Star(vec2 uv, float flare) {
	float StarGlow = 0.0125;

	float d = length(uv);
	float m = sin(StarGlow * 1.2) / d;
	float rays = max(0., .5 - abs(uv.x * uv.y * 1000.)); 
	// m += (rays * flare) * 2.;
	m *= smoothstep(1., .1, d);
	return m;
}

float Hash21(vec2 p) {
		p = fract(p * vec2(123.34, 456.21));
		p += dot(p, p + 45.32);
		return fract(p.x * p.y);
}

vec3 StarLayer(vec2 uv) {
	float iTime = ${U_TIME};
	float TAU = 6.28318;

	vec3 col = vec3(0);
	vec2 gv = fract(uv);
	vec2 id = floor(uv);
	for(int y=-1;y<=1;y++){
		for(int x=-1; x<=1; x++){
			vec2 offs = vec2(x, y);
			float n = Hash21(id + offs);
			float size = fract(n);
			float star = Star(gv - offs - vec2(n, fract(n * 34.)) + .5, smoothstep(.1, .9, size) * .46);
			vec3 color = sin(vec3(.2, .3, .9) * fract(n * 2345.2) * TAU) * .25 + .75;
			color = color * vec3(.9, .59, .9 + size);
			star *= sin(iTime * .6 + n * TAU) * .5 + .5;
			col += star * size * color;
		}
	}
	return col;
}

void main() {
	float iTime = ${U_TIME};
	float Velocity = .015;

	vec2 M = vec2(0);
	M -= vec2(M.x + sin(iTime * 0.005), M.y - cos(iTime * 0.005));
	M += vp.xy;
	float t = iTime * Velocity; 
	vec3 col = vec3(0);  
	for(float i=0.; i<2.; i+=.125) {
		float depth = fract(i + t);
		float scale = mix(1., .15, depth);
		float fade = depth * smoothstep(1., .9, depth);
		col += StarLayer(vp.xy * scale + i * 453.2 - iTime * .05 + M) * fade;
	}

	gl_FragColor = vec4(col, 1.);
}
`;

let StarfieldShader = new ShaderProgram(vertexStarfieldShader, fragmentStarfieldShader);
