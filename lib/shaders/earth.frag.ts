const earthFrag = /* glsl */ `
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform vec3 uSunDirectionWorld;  // world-space, matches world-space vNormal
uniform vec3 uAtmosphereColor;

varying vec2 vUv;
varying vec3 vNormal;   // world-space
varying vec3 vViewDir;  // world-space

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sunDir = normalize(uSunDirectionWorld);

  // Dot product: 1.0 at subsolar point, -1.0 at antisolar point
  float sunDot = dot(normal, sunDir);

  // Soft terminator band: blend day->night over ~12 degrees either side of terminator
  // smoothstep(-0.1, 0.1, sunDot): 0.0 on night side, 1.0 on day side
  float dayBlend = smoothstep(-0.1, 0.1, sunDot);

  vec4 dayColor   = texture2D(uDayTexture,   vUv);
  vec4 nightColor = texture2D(uNightTexture, vUv) * 0.9;

  vec4 color = mix(nightColor, dayColor, dayBlend);

  // Atmosphere rim — only on lit limb (intentional design choice)
  // Fresnel: strongest at grazing viewing angles
  float fresnel = 1.0 - abs(dot(normal, normalize(vViewDir)));
  fresnel = pow(fresnel, 3.0);
  float rimStrength = max(0.0, sunDot) * fresnel * 0.5;

  color.rgb += uAtmosphereColor * rimStrength;

  gl_FragColor = color;
}
`

export default earthFrag
