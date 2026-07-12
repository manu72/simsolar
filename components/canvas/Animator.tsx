'use client'

import { useContext } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SimulationContext } from './SimulationContext'
import { useAppStore } from '@/store/useAppStore'
import { getEarthOrbitalPosition, getPlanetOrbitalPosition, compressDisplayPosition } from '@/lib/orbitalMechanics'
import {
  DAYS_PER_SECOND_BASE,
  TWO_PI_PER_SIDEREAL_SECOND,
  MOON_ORBIT_RADIUS,
  MOON_SIDEREAL_PERIOD_DAYS,
  MOON_INCLINATION_RAD,
  MOON_NODAL_PRECESSION_YEARS,
  DEFAULT_EARTH_SCALE,
  PLANET_DATA,
  type PlanetId,
} from '@/lib/constants'

// Pre-allocated objects reused every frame to avoid GC pressure
const _moonLocalPos = new THREE.Vector3()
const _inclinationEuler = new THREE.Euler(0, 0, 0, 'YXZ')
const _focusOffset = new THREE.Vector3()

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
    const { isPlaying, orbitSpeed, rotationSpeed, earthScale, focusTarget, activeSeasonExplainer } = useAppStore.getState()

    if (isPlaying) {
      // The SimulationClock is intentionally a plain mutable object shared via
      // context (see CLAUDE.md): it is advanced inside useFrame — never during
      // render — to avoid React re-renders in the animation loop. The
      // immutability rule cannot see that distinction, so it is disabled here.
      /* eslint-disable react-hooks/immutability */
      clock.julianDay   += delta * orbitSpeed * DAYS_PER_SECOND_BASE
      clock.rotationAngle += delta * rotationSpeed * TWO_PI_PER_SIDEREAL_SECOND
      /* eslint-enable react-hooks/immutability */
    } else if (activeSeasonExplainer) {
      // Explainers hold Earth at the selected orbital date, but the globe still
      // spins so viewers can watch the day/night line move across the tilted Earth.
      clock.rotationAngle += delta * rotationSpeed * TWO_PI_PER_SIDEREAL_SECOND
    }

    // Display-compressed, matching Planet/OrbitPath rendering. The direction
    // is unchanged, so the day/night shader and season geometry stay correct.
    const earthPos = compressDisplayPosition(getEarthOrbitalPosition(clock.julianDay))

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
    // The focused body sits at the origin: everything positioned
    // heliocentrically is shifted by -focusOffset (the focused body's
    // heliocentric position). The other planets live inside worldGroup at
    // their heliocentric positions, so the worldGroup shift covers them too.
    if (focusTarget === 'moon') {
      _focusOffset.copy(earthPos).add(_moonLocalPos)
    } else if (focusTarget === 'earth') {
      _focusOffset.copy(earthPos)
    } else if (focusTarget in PLANET_DATA) {
      _focusOffset.copy(compressDisplayPosition(getPlanetOrbitalPosition(focusTarget as PlanetId, clock.julianDay)))
    } else {
      _focusOffset.set(0, 0, 0)
    }

    if (earthGroupRef.current) {
      earthGroupRef.current.position.copy(earthPos).sub(_focusOffset)
      // Planet Scale applies to Earth unless another planet is the focus
      const otherPlanetFocused = focusTarget in PLANET_DATA
      earthGroupRef.current.scale.setScalar(otherPlanetFocused ? DEFAULT_EARTH_SCALE : earthScale)
    }
    if (worldGroupRef.current) {
      worldGroupRef.current.position.copy(_focusOffset).negate()
    }

    if (earthMeshRef.current) {
      earthMeshRef.current.rotation.y = clock.rotationAngle
    }

    // Sun world position for the Earth day/night shader.
    // In each mode, Sun = worldGroup origin, so its world position equals worldGroupRef.position.
    if (earthMaterialRef.current) {
      earthMaterialRef.current.uniforms.uSunPositionWorld.value.copy(_focusOffset).negate()
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
