varying vec2 vUv;
varying vec3 vNormal;      // world-space normal
varying vec3 vViewDir;     // world-space view direction

void main() {
  vUv = uv;

  // World-space normal (mat3(modelMatrix) for uniform-scale sphere).
  // NOT normalMatrix — that transforms to view space and would mismatch
  // uSunDirectionWorld which is kept in world space.
  vNormal = normalize(mat3(modelMatrix) * normal);

  // World-space view direction (for atmosphere rim Fresnel)
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
