'use client'

import { useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Animator } from './Animator'
import { Sun } from './Sun'
import { Earth } from './Earth'
import { OrbitPath } from './OrbitPath'
import { Starfield } from './Starfield'
import { Annotations } from './Annotations'

export function Scene() {
  // Shared mesh refs — created here, passed to Animator + Earth
  const earthGroupRef    = useRef<THREE.Group>(null)
  const earthMeshRef     = useRef<THREE.Mesh>(null)
  const earthMaterialRef = useRef<THREE.ShaderMaterial>(null)

  return (
    <Canvas
      camera={{ position: [0, 120, 280], fov: 45 }}
      style={{ background: '#000005' }}
      gl={{ antialias: true }}
    >
      <Animator
        earthGroupRef={earthGroupRef}
        earthMeshRef={earthMeshRef}
        earthMaterialRef={earthMaterialRef}
      />
      <Starfield />
      <OrbitPath />
      <Sun />
      <Annotations />
      <Suspense fallback={null}>
        <Earth
          groupRef={earthGroupRef}
          meshRef={earthMeshRef}
          materialRef={earthMaterialRef}
        />
      </Suspense>
      <OrbitControls
        minDistance={50}
        maxDistance={600}
        enablePan={false}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
