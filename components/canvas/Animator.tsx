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
  MOON_ORBIT_RADIUS,
  MOON_SIDEREAL_PERIOD_DAYS,
  MOON_INCLINATION_RAD,
  MOON_NODAL_PRECESSION_YEARS,
} from '@/lib/constants'

interface AnimatorProps {
  earthGroupRef: React.RefObject<THREE.Group | null>
  earthMeshRef: React.RefObject<THREE.Mesh | null>
  earthMaterialRef: React.RefObject<THREE.ShaderMaterial | null>
  worldGroupRef: React.RefObject<THREE.Group | null>
  moonGroupRef: React.RefObject<THREE.Group | null>
  moonInclinationGroupRef: React.RefObject<THREE.Group | null>
}

export function Animator({ earthGroupRef, earthMeshRef, earthMaterialRef, worldGroupRef, moonGroupRef, moonInclinationGroupRef }: AnimatorProps) {
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

    // ── Moon ──────────────────────────────────────────────────────────────
    // Orbital angle derived from clock.rotationAngle (world space).
    // clock.rotationAngle encodes exactly 2π per sidereal day, so dividing
    // by MOON_SIDEREAL_PERIOD_DAYS (27.321) gives 2π per lunar orbit.
    const moonOrbitalAngle = clock.rotationAngle / MOON_SIDEREAL_PERIOD_DAYS

    if (moonGroupRef.current) {
      moonGroupRef.current.position.set(
        MOON_ORBIT_RADIUS * Math.cos(moonOrbitalAngle),
        0,
        MOON_ORBIT_RADIUS * Math.sin(moonOrbitalAngle),
      )
      // Tidal locking: same face always toward Earth (centre of orbit)
      moonGroupRef.current.rotation.y = -moonOrbitalAngle + Math.PI
    }

    // Orbital precession — ascending node rotates over 18.6-year cycle.
    // Derived from rotationAngle so it stays synchronised with Moon motion.
    if (moonInclinationGroupRef.current) {
      const moonOrbits = clock.rotationAngle / (MOON_SIDEREAL_PERIOD_DAYS * 2 * Math.PI)
      const moonYears = moonOrbits * MOON_SIDEREAL_PERIOD_DAYS / 365.25
      const precessionAngle = (2 * Math.PI * moonYears) / MOON_NODAL_PRECESSION_YEARS
      moonInclinationGroupRef.current.rotation.set(MOON_INCLINATION_RAD, precessionAngle, 0, 'YXZ')
    }
  })

  return null
}
