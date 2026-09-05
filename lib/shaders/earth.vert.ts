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

  // Sun direction from Earth's CENTRE, not from each vertex. The scene Sun is
  // only a few Earth radii away (orbit 200 units, globe up to 60), so a
  // per-vertex direction lights a cap of arccos(R/D) < 90° and pushes the
  // terminator up to 17.5° into the day side — both poles end up dark at the
  // equinox. Real sunlight is parallel to 0.002°, so one shared direction is
  // the physically correct model. Works in every focus frame because
  // uSunPositionWorld is the Sun's true world position.
  vec3 earthCentre = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vSunDir = normalize(uSunPositionWorld - earthCentre);

  // World-space view direction (for atmosphere rim Fresnel)
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export default earthVert
