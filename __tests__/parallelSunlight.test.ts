import { describe, it, expect } from 'vitest'
import { ShaderLib, type WebGLProgramParametersWithUniforms } from 'three'
import { parallelSunlight } from '@/lib/shaders/parallelSunlight'

// Guards the string patch against three.js chunk renames: if any anchor stops
// matching, the point-light direction silently reverts to per-fragment.
describe('parallelSunlight', () => {
  const shader = {
    vertexShader: ShaderLib.standard.vertexShader,
    fragmentShader: ShaderLib.standard.fragmentShader,
  } as WebGLProgramParametersWithUniforms
  parallelSunlight(shader)

  it('feeds the point light the body centre instead of the fragment position', () => {
    expect(shader.fragmentShader).toContain('getPointLightInfo( pointLight, vBodyCentreView, directLight );')
    expect(shader.fragmentShader).not.toContain('getPointLightInfo( pointLight, geometryPosition, directLight );')
  })

  it('declares and assigns the centre varying in both stages', () => {
    expect(shader.vertexShader).toContain('varying vec3 vBodyCentreView;')
    expect(shader.vertexShader).toContain('vBodyCentreView = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;')
    expect(shader.fragmentShader).toContain('varying vec3 vBodyCentreView;')
  })
})
