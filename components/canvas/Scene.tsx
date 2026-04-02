'use client'

import { useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { TOUCH } from 'three'
import type * as THREE from 'three'
import { Animator } from './Animator'
import { Sun } from './Sun'
import { Earth } from './Earth'
import { Moon } from './Moon'
import { OrbitPath } from './OrbitPath'
import { Starfield } from './Starfield'
import { Annotations } from './Annotations'
import { ZoomSync } from './ZoomSync'

type OrbitControlsRef = React.ElementRef<typeof OrbitControls>

export function Scene() {
  const earthGroupRef    = useRef<THREE.Group>(null)
  const earthMeshRef     = useRef<THREE.Mesh>(null)
  const earthMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const worldGroupRef    = useRef<THREE.Group>(null)
  const moonGroupRef             = useRef<THREE.Group>(null)
  const moonInclinationGroupRef  = useRef<THREE.Group>(null)
  const controlsRef              = useRef<OrbitControlsRef>(null)

  return (
    <Canvas
      camera={{ position: [0, 80, 392], fov: 45 }}
      style={{ background: '#000005' }}
      gl={{ antialias: true }}
    >
      <Animator
        earthGroupRef={earthGroupRef}
        earthMeshRef={earthMeshRef}
        earthMaterialRef={earthMaterialRef}
        worldGroupRef={worldGroupRef}
        moonGroupRef={moonGroupRef}
        moonInclinationGroupRef={moonInclinationGroupRef}
      />
      <Starfield />
      {/* World group: Sun, orbit path, annotations — offset when Earth is focused */}
      <group ref={worldGroupRef}>
        <OrbitPath />
        <Sun />
        <Annotations />
      </group>
      <Suspense fallback={null}>
        <Earth
          groupRef={earthGroupRef}
          meshRef={earthMeshRef}
          materialRef={earthMaterialRef}
        >
          <Moon
            groupRef={moonGroupRef}
            inclinationGroupRef={moonInclinationGroupRef}
          />
        </Earth>
      </Suspense>
      <ZoomSync controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        minDistance={50}
        maxDistance={600}
        enablePan
        touches={{ TWO: TOUCH.DOLLY_PAN }}
      />
    </Canvas>
  )
}
