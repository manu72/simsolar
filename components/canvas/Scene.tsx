'use client'

import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
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
      {/* SimulationContext is provided by ClientRoot — no Provider here */}
      <Animator
        earthGroupRef={earthGroupRef}
        earthMeshRef={earthMeshRef}
        earthMaterialRef={earthMaterialRef}
      />

      <Starfield />
      <OrbitPath />
      <Annotations />

      <Sun />
      <Earth
        groupRef={earthGroupRef}
        meshRef={earthMeshRef}
        materialRef={earthMaterialRef}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          intensity={1.5}
          mipmapBlur
        />
      </EffectComposer>

      <OrbitControls
        minDistance={50}
        maxDistance={600}
        enablePan={false}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
