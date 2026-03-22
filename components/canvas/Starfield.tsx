'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

const STAR_COUNT = 2000
const SPHERE_RADIUS = 800

const vertexShader = `
attribute float size;
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = `
uniform float opacity;
void main() {
  // Circular point
  vec2 coord = gl_PointCoord - vec2(0.5);
  if (length(coord) > 0.5) discard;
  gl_FragColor = vec4(1.0, 1.0, 1.0, opacity);
}
`

export function Starfield() {
  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3]     = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = SPHERE_RADIUS * Math.cos(phi)
      sizes[i] = 0.3 + Math.random() * 1.2  // varied: [0.3, 1.5)
    }
    return { positions, sizes }
  }, [])

  const uniforms = useMemo(() => ({ opacity: { value: 0.8 } }), [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
