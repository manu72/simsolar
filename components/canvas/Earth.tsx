'use client'

import { useRef, useMemo } from 'react'
import { useTexture, Line } from '@react-three/drei'
import * as THREE from 'three'
import { EARTH_RADIUS, EARTH_AXIS_LENGTH, AXIAL_TILT_RAD } from '@/lib/constants'
import earthVert from '@/lib/shaders/earth.vert.glsl'
import earthFrag from '@/lib/shaders/earth.frag.glsl'

interface EarthProps {
  groupRef: React.RefObject<THREE.Group>
  meshRef: React.RefObject<THREE.Mesh>
  materialRef: React.RefObject<THREE.ShaderMaterial>
}

export function Earth({ groupRef, meshRef, materialRef }: EarthProps) {
  const [dayTexture, nightTexture] = useTexture([
    '/textures/earth-day.jpg',
    '/textures/earth-night.png',
  ])

  const uniforms = useMemo(
    () => ({
      uDayTexture:         { value: dayTexture },
      uNightTexture:       { value: nightTexture },
      uSunDirectionWorld:  { value: new THREE.Vector3(1, 0, 0) }, // world-space, set each frame by Animator
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
    // Outer group: handles orbital position (set by Animator)
    // Inner group: handles axial tilt (23.5° rotation on Z axis, fixed)
    <group ref={groupRef}>
      <group rotation={[0, 0, AXIAL_TILT_RAD]}>
        <mesh ref={meshRef}>
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
