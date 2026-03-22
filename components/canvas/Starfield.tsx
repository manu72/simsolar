'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const STAR_COUNT = 2000
const SPHERE_RADIUS = 800

export function Starfield() {
  const positionsRef = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      // Random point on sphere surface
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3]     = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = SPHERE_RADIUS * Math.cos(phi)
      sizes[i] = 0.3 + Math.random() * 1.2
    }
    return { positions, sizes }
  }, [])

  const geometryRef = useRef<THREE.BufferGeometry>(null)

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[positionsRef.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[positionsRef.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={1.5}
        sizeAttenuation
        transparent
        opacity={0.8}
        vertexColors={false}
      />
    </points>
  )
}
