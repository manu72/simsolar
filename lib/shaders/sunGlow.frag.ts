const sunGlowFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // Fresnel: strongest at edges (grazing angle), fades toward center
  float fresnel = 1.0 - dot(vNormal, vViewDir);
  // Smooth power curve for natural glow falloff
  float glow = pow(fresnel, 3.0) * uIntensity;

  gl_FragColor = vec4(uColor, glow);
}
`

export default sunGlowFrag
