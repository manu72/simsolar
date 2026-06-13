'use client'

import { useContext, useMemo, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type * as THREE from 'three'
import { getInitialHeliocentricCameraPosition } from '@/lib/cameraMath'
import { getEarthOrbitalPosition } from '@/lib/orbitalMechanics'
import { SimulationContext } from './SimulationContext'
import { Animator } from './Animator'
import { Sun } from './Sun'
import { Earth } from './Earth'
import { Moon } from './Moon'
import { OrbitPath } from './OrbitPath'
import { Starfield } from './Starfield'
import { Annotations } from './Annotations'
import { ZoomSync } from './ZoomSync'

type OrbitControlsRef = React.ElementRef<typeof OrbitControls>

interface SceneProps {
  isReady: boolean
  onReady: () => void
}

export function Scene({ isReady, onReady }: SceneProps) {
  const clock = useContext(SimulationContext)
  const earthGroupRef    = useRef<THREE.Group>(null)
  const earthMeshRef     = useRef<THREE.Mesh>(null)
  const earthMaterialRef = useRef<THREE.ShaderMaterial>(null)
  const worldGroupRef    = useRef<THREE.Group>(null)
  const moonGroupRef             = useRef<THREE.Group>(null)
  const moonInclinationGroupRef  = useRef<THREE.Group>(null)
  const controlsRef              = useRef<OrbitControlsRef>(null)
  const initialCameraPosition = useMemo(
    () => getInitialHeliocentricCameraPosition(getEarthOrbitalPosition(clock.julianDay), 80, 392),
    [clock],
  )

  return (
    <Canvas
      camera={{ position: initialCameraPosition, fov: 45 }}
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
        {isReady ? (
          <>
            <OrbitPath />
            <Sun />
            <Annotations />
          </>
        ) : null}
      </group>
      <Suspense fallback={null}>
        <Earth
          groupRef={earthGroupRef}
          meshRef={earthMeshRef}
          materialRef={earthMaterialRef}
          isVisible={isReady}
          onReady={onReady}
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
      />
    </Canvas>
  )
}
