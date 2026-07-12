'use client'

import { useMemo } from 'react'

const STAR_COUNT = 2000
// Outside MAX_ZOOM_DISTANCE (5000) so the camera never exits the star sphere
const SPHERE_RADIUS = 8000

const vertexShader = `
attribute float size;
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (3000.0 / -mvPosition.z);
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

// Deterministic PRNG (mulberry32). Rendering must be pure, so we can't use
// Math.random() here — a fixed seed keeps generation idempotent and gives
// every visitor the same starfield.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const STAR_SEED = 0x5747a5e // arbitrary fixed seed

export function Starfield() {
  const { positions, sizes } = useMemo(() => {
    const random = mulberry32(STAR_SEED)
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = random() * 2 * Math.PI
      const phi = Math.acos(2 * random() - 1)
      positions[i * 3]     = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = SPHERE_RADIUS * Math.cos(phi)
      sizes[i] = 0.3 + random() * 1.2  // varied: [0.3, 1.5)
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
