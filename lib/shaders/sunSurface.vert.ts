const sunSurfaceVert = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;

vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}

// 3D value noise with trilinear interpolation (matches the 2D pattern in sunSurface.frag)
float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash3(i).x;
  float n100 = hash3(i + vec3(1.0, 0.0, 0.0)).x;
  float n010 = hash3(i + vec3(0.0, 1.0, 0.0)).x;
  float n110 = hash3(i + vec3(1.0, 1.0, 0.0)).x;
  float n001 = hash3(i + vec3(0.0, 0.0, 1.0)).x;
  float n101 = hash3(i + vec3(1.0, 0.0, 1.0)).x;
  float n011 = hash3(i + vec3(0.0, 1.0, 1.0)).x;
  float n111 = hash3(i + vec3(1.0, 1.0, 1.0)).x;

  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec3 pos = position;
  float displacement = (noise3D(pos * 0.3 + uTime * 0.15) - 0.5) * 0.4;
  pos += normal * displacement;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export default sunSurfaceVert
