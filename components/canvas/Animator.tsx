'use client'

import { useContext } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SimulationContext } from './SimulationContext'
import { useAppStore } from '@/store/useAppStore'
import { getEarthOrbitalPosition } from '@/lib/orbitalMechanics'
import {
  DAYS_PER_SECOND_BASE,
  TWO_PI_PER_SIDEREAL_SECOND,
} from '@/lib/constants'

interface AnimatorProps {
  earthGroupRef: React.RefObject<THREE.Group | null>
  earthMeshRef: React.RefObject<THREE.Mesh | null>
  earthMaterialRef: React.RefObject<THREE.ShaderMaterial | null>
  worldGroupRef: React.RefObject<THREE.Group | null>
}

export function Animator({ earthGroupRef, earthMeshRef, earthMaterialRef, worldGroupRef }: AnimatorProps) {
  const clock = useContext(SimulationContext)

  useFrame((_, delta) => {
    const { isPlaying, orbitSpeed, rotationSpeed, earthScale, focusTarget } = useAppStore.getState()

    if (isPlaying) {
      clock.julianDay   += delta * orbitSpeed * DAYS_PER_SECOND_BASE
      clock.rotationAngle += delta * rotationSpeed * TWO_PI_PER_SIDEREAL_SECOND
    }

    const earthPos = getEarthOrbitalPosition(clock.julianDay)

    if (focusTarget === 'earth') {
      // Earth-centric: Earth at origin, world offset by -earthPos
      if (earthGroupRef.current) {
        earthGroupRef.current.position.set(0, 0, 0)
        earthGroupRef.current.scale.setScalar(earthScale)
      }
      if (worldGroupRef.current) {
        worldGroupRef.current.position.copy(earthPos).negate()
      }
    } else {
      // Sun-centric (default): Sun at origin, Earth at orbital position
      if (earthGroupRef.current) {
        earthGroupRef.current.position.copy(earthPos)
        earthGroupRef.current.scale.setScalar(earthScale)
      }
      if (worldGroupRef.current) {
        worldGroupRef.current.position.set(0, 0, 0)
      }
    }

    if (earthMeshRef.current) {
      earthMeshRef.current.rotation.y = clock.rotationAngle
    }

    if (earthMaterialRef.current) {
      // Pass the Sun's actual world position to the shader.
      // The vertex shader computes per-vertex sun direction from this,
      // which works correctly in both heliocentric and geocentric modes.
      const sunWorldPos = focusTarget === 'earth'
        ? earthPos.clone().negate()  // Sun at -earthPos when Earth is at origin
        : new THREE.Vector3(0, 0, 0) // Sun at origin in heliocentric mode
      earthMaterialRef.current.uniforms.uSunPositionWorld.value.copy(sunWorldPos)
    }
  })

  return null
}
