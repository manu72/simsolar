const sunSurfaceVert = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;

// Simple 3D noise hash
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Subtle vertex displacement for surface turbulence
  vec3 pos = position;
  vec3 noiseInput = pos * 0.3 + uTime * 0.15;
  vec3 h = hash3(floor(noiseInput));
  float displacement = (h.x - 0.5) * 0.4;
  pos += normal * displacement;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export default sunSurfaceVert
