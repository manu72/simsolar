'use client'

import { useContext, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SimulationContext } from './SimulationContext'
import { useAppStore } from '@/store/useAppStore'
import { getEarthOrbitalPosition, julianDayToDate } from '@/lib/orbitalMechanics'
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
  const lastDisplayUpdate = useRef(0)

  useFrame((_, delta) => {
    // Read controls non-reactively (zero re-renders)
    const { isPlaying, orbitSpeed, rotationSpeed, setDisplayDate } =
      useAppStore.getState()

    // Advance simulation time
    if (isPlaying) {
      clock.julianDay   += delta * orbitSpeed * DAYS_PER_SECOND_BASE
      clock.rotationAngle += delta * rotationSpeed * TWO_PI_PER_SIDEREAL_SECOND
    }

    // Update Earth orbital position
    const earthPos = getEarthOrbitalPosition(clock.julianDay)

    if (earthGroupRef.current) {
      earthGroupRef.current.position.copy(earthPos)
    }

    // Update Earth rotation (Y axis spin in local space — inside the tilt group)
    if (earthMeshRef.current) {
      earthMeshRef.current.rotation.y = clock.rotationAngle
    }

    // Update sun direction uniform — world space matches world-space vNormal in shader
    if (earthMaterialRef.current) {
      // World-space unit vector from Earth toward Sun (Sun is always at origin)
      const worldSunDir = earthPos.clone().negate().normalize()
      earthMaterialRef.current.uniforms.uSunDirectionWorld.value.copy(worldSunDir)
    }

    // Throttle HUD date update to ~4fps
    lastDisplayUpdate.current += delta
    if (lastDisplayUpdate.current >= 0.25) {
      lastDisplayUpdate.current = 0
      setDisplayDate(julianDayToDate(clock.julianDay))
    }
  })

  return null
}
