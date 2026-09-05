import { ShaderChunk, type WebGLProgramParametersWithUniforms } from 'three'

/**
 * onBeforeCompile patch for meshStandardMaterial bodies lit by the Sun's
 * point light. The scene Sun sits only a few radii from each body, so the
 * stock per-fragment light direction lights a cap of arccos(R/D) < 90° and
 * pulls the terminator into the day side (~7° for Jupiter). Real sunlight is
 * parallel to a fraction of a degree, so take the light direction from the
 * body's centre instead of from each fragment. Same fix as earth.vert.ts.
 */
export function parallelSunlight(shader: WebGLProgramParametersWithUniforms): void {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vBodyCentreView;')
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvBodyCentreView = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;',
    )
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vBodyCentreView;')
    .replace(
      '#include <lights_fragment_begin>',
      ShaderChunk.lights_fragment_begin.replace(
        'getPointLightInfo( pointLight, geometryPosition, directLight );',
        'getPointLightInfo( pointLight, vBodyCentreView, directLight );',
      ),
    )
}
