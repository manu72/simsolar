const sunSurfaceFrag = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;

// Simple pseudo-noise for color variation
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // smoothstep

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  // Animated UV for surface movement
  vec2 uv = vUv * 6.0;
  float t = uTime * 0.08;

  // Layer noise at different speeds for depth
  float n1 = fbm(uv + vec2(t, t * 0.7));
  float n2 = fbm(uv * 1.5 + vec2(-t * 0.5, t * 0.3));
  float pattern = n1 * 0.6 + n2 * 0.4;

  // Sun color palette: deep orange to bright yellow-white
  vec3 darkColor = vec3(0.9, 0.4, 0.05);   // deep orange
  vec3 midColor  = vec3(1.0, 0.65, 0.15);  // orange
  vec3 hotColor  = vec3(1.0, 0.9, 0.5);    // yellow-white

  vec3 color = mix(darkColor, midColor, pattern);
  color = mix(color, hotColor, smoothstep(0.55, 0.75, pattern));

  // Limb darkening — edges slightly darker
  float rim = dot(vNormal, vec3(0.0, 0.0, 1.0));
  rim = clamp(rim, 0.0, 1.0);
  color *= mix(0.7, 1.0, rim);

  gl_FragColor = vec4(color, 1.0);
}
`

export default sunSurfaceFrag
