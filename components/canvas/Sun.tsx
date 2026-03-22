'use client'

import * as THREE from 'three'
import { SUN_RADIUS } from '@/lib/constants'

const GLOW_SCALE = 2.8
const GLOW_COLOR = new THREE.Color('#ffa500')

export function Sun() {
  return (
    <>
      <pointLight
        intensity={2.5}
        distance={600}
        decay={1}
        color="#fff5e0"
      />
      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#ffa500" />
      </mesh>
      {/* Additive glow — replaces postprocessing Bloom */}
      <mesh scale={GLOW_SCALE}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={GLOW_COLOR}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}
