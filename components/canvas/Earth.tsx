'use client'

import { useRef, useMemo } from 'react'
import { useTexture, Line } from '@react-three/drei'
import * as THREE from 'three'
import { EARTH_RADIUS, EARTH_AXIS_LENGTH, AXIAL_TILT_RAD } from '@/lib/constants'
import { useAppStore } from '@/store/useAppStore'
import earthVert from '@/lib/shaders/earth.vert'
import earthFrag from '@/lib/shaders/earth.frag'

interface EarthProps {
  groupRef: React.RefObject<THREE.Group | null>
  meshRef: React.RefObject<THREE.Mesh | null>
  materialRef: React.RefObject<THREE.ShaderMaterial | null>
}

export function Earth({ groupRef, meshRef, materialRef }: EarthProps) {
  const [dayTexture, nightTexture] = useTexture([
    '/textures/earth-day.jpg',
    '/textures/earth-night.jpg',
  ])

  const uniforms = useMemo(
    () => ({
      uDayTexture:         { value: dayTexture },
      uNightTexture:       { value: nightTexture },
      uSunPositionWorld:   { value: new THREE.Vector3(0, 0, 0) },
      uAtmosphereColor:    { value: new THREE.Vector3(0.3, 0.6, 1.0) },
    }),
    [dayTexture, nightTexture],
  )

  // Axis line endpoints in local space (pole to pole)
  const axisPoints = useMemo<[THREE.Vector3, THREE.Vector3]>(
    () => [
      new THREE.Vector3(0, -EARTH_AXIS_LENGTH / 2, 0),
      new THREE.Vector3(0,  EARTH_AXIS_LENGTH / 2, 0),
    ],
    [],
  )

  return (
    <group ref={groupRef}>
      <group rotation={[0, 0, AXIAL_TILT_RAD]}>
        <mesh
          ref={meshRef}
          onClick={() => useAppStore.getState().toggleFocusTarget()}
          onPointerOver={() => { document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'auto' }}
        >
          <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
          <shaderMaterial
            ref={materialRef}
            vertexShader={earthVert}
            fragmentShader={earthFrag}
            uniforms={uniforms}
          />
        </mesh>

        {/* Axis line — pole to pole, subtle */}
        <Line
          points={axisPoints}
          color="white"
          lineWidth={0.8}
          transparent
          opacity={0.4}
        />
      </group>
    </group>
  )
}
