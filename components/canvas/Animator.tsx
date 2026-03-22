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
}

export function Animator({ earthGroupRef, earthMeshRef, earthMaterialRef }: AnimatorProps) {
  const clock = useContext(SimulationContext)

  useFrame((_, delta) => {
    const { isPlaying, orbitSpeed, rotationSpeed } = useAppStore.getState()

    if (isPlaying) {
      clock.julianDay   += delta * orbitSpeed * DAYS_PER_SECOND_BASE
      clock.rotationAngle += delta * rotationSpeed * TWO_PI_PER_SIDEREAL_SECOND
    }

    const earthPos = getEarthOrbitalPosition(clock.julianDay)

    if (earthGroupRef.current) {
      earthGroupRef.current.position.copy(earthPos)
    }

    if (earthMeshRef.current) {
      earthMeshRef.current.rotation.y = clock.rotationAngle
    }

    if (earthMaterialRef.current) {
      const worldSunDir = earthPos.clone().negate().normalize()
      earthMaterialRef.current.uniforms.uSunDirectionWorld.value.copy(worldSunDir)
    }
  })

  return null
}
