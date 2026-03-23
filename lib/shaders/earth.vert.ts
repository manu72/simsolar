const earthVert = /* glsl */ `
uniform vec3 uSunPositionWorld;

varying vec2 vUv;
varying vec3 vNormal;      // world-space normal
varying vec3 vViewDir;     // world-space view direction
varying vec3 vSunDir;      // world-space direction to sun from this vertex

void main() {
  vUv = uv;

  vec4 worldPos = modelMatrix * vec4(position, 1.0);

  // World-space normal (mat3(modelMatrix) for uniform-scale sphere)
  vNormal = normalize(mat3(modelMatrix) * normal);

  // Per-vertex sun direction — computed from actual world positions,
  // correct in both heliocentric and geocentric reference frames
  vSunDir = normalize(uSunPositionWorld - worldPos.xyz);

  // World-space view direction (for atmosphere rim Fresnel)
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export default earthVert
