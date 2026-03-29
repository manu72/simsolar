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

// Pre-allocated objects reused every frame to avoid GC pressure
const _moonLocalPos = new THREE.Vector3()
const _inclinationEuler = new THREE.Euler(0, 0, 0, 'YXZ')

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

    // ── Moon derived values (needed before focus-target positioning) ─────
    // clock.rotationAngle encodes 2π per sidereal day; dividing by
    // MOON_SIDEREAL_PERIOD_DAYS gives 2π per lunar orbit.
    const moonOrbitalAngle = clock.rotationAngle / MOON_SIDEREAL_PERIOD_DAYS
    const moonOrbits = clock.rotationAngle / (MOON_SIDEREAL_PERIOD_DAYS * 2 * Math.PI)
    const moonYears = moonOrbits * MOON_SIDEREAL_PERIOD_DAYS / 365.25
    const precessionAngle = (2 * Math.PI * moonYears) / MOON_NODAL_PRECESSION_YEARS

    // Moon's position in Earth's local space (with orbital inclination applied)
    _moonLocalPos.set(
      MOON_ORBIT_RADIUS * Math.cos(moonOrbitalAngle),
      0,
      MOON_ORBIT_RADIUS * Math.sin(moonOrbitalAngle),
    )
    _inclinationEuler.set(MOON_INCLINATION_RAD, -precessionAngle, 0)
    _moonLocalPos.applyEuler(_inclinationEuler)

    // ── Reference-frame positioning ─────────────────────────────────────
    if (focusTarget === 'moon') {
      // Selenocentric: Moon at origin, Earth offset by -moonLocalPos,
      // world (Sun/orbit) offset by -(earthPos + moonLocalPos)
      if (earthGroupRef.current) {
        earthGroupRef.current.position.copy(_moonLocalPos).negate()
        earthGroupRef.current.scale.setScalar(earthScale)
      }
      if (worldGroupRef.current) {
        worldGroupRef.current.position.copy(earthPos).add(_moonLocalPos).negate()
      }
    } else if (focusTarget === 'earth') {
      // Geocentric: Earth at origin, world offset by -earthPos
      if (earthGroupRef.current) {
        earthGroupRef.current.position.set(0, 0, 0)
        earthGroupRef.current.scale.setScalar(earthScale)
      }
      if (worldGroupRef.current) {
        worldGroupRef.current.position.copy(earthPos).negate()
      }
    } else {
      // Heliocentric (default): Sun at origin, Earth at orbital position
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

    // Sun world position for the Earth day/night shader.
    // In each mode, Sun = worldGroup origin, so its world position equals worldGroupRef.position.
    if (earthMaterialRef.current) {
      const sunUniform = earthMaterialRef.current.uniforms.uSunPositionWorld.value
      if (focusTarget === 'sun') {
        sunUniform.set(0, 0, 0)
      } else if (focusTarget === 'earth') {
        sunUniform.copy(earthPos).negate()
      } else {
        sunUniform.copy(earthPos).add(_moonLocalPos).negate()
      }
    }

    // ── Moon local transforms (within earthGroup) ───────────────────────
    if (moonGroupRef.current) {
      moonGroupRef.current.position.set(
        MOON_ORBIT_RADIUS * Math.cos(moonOrbitalAngle),
        0,
        MOON_ORBIT_RADIUS * Math.sin(moonOrbitalAngle),
      )
      moonGroupRef.current.rotation.y = -moonOrbitalAngle + Math.PI
    }

    if (moonInclinationGroupRef.current) {
      moonInclinationGroupRef.current.rotation.set(MOON_INCLINATION_RAD, -precessionAngle, 0, 'YXZ')
    }
  })

  return null
}
