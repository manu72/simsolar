'use client'

import { useContext, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { PLANET_DATA, SIDEREAL_DAY_DAYS, EARTH_PERIHELION_LONGITUDE_DEG, DEFAULT_EARTH_SCALE, type InnerPlanet } from '@/lib/constants'
import { getPlanetOrbitalPosition } from '@/lib/orbitalMechanics'
import { useAppStore } from '@/store/useAppStore'
import { usePlanetDrag } from '@/lib/usePlanetDrag'
import { SimulationContext } from './SimulationContext'
import { OrbitPath } from './OrbitPath'

interface PlanetProps {
  planet: InnerPlanet
}

/**
 * A textured inner planet plus its orbit path. Rendered inside worldGroup,
 * positioned heliocentrically each frame — the Animator's worldGroup offset
 * then makes it correct in every focus mode for free.
 */
export function Planet({ planet }: PlanetProps) {
  const clock = useContext(SimulationContext)
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const { onPointerDown } = usePlanetDrag(planet)
  const explainerActive = useAppStore(s => Boolean(s.activeSeasonExplainer))
  const data = PLANET_DATA[planet]
  const texture = useTexture(data.texture, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
  })

  useFrame(() => {
    const { earthScale, focusTarget } = useAppStore.getState()
    if (groupRef.current) {
      groupRef.current.position.copy(getPlanetOrbitalPosition(planet, clock.julianDay))
      // Planet Scale only applies to the focused planet
      groupRef.current.scale.setScalar(focusTarget === planet ? earthScale : DEFAULT_EARTH_SCALE)
    }
    if (meshRef.current) {
      // clock.rotationAngle is 2π per Earth sidereal day; rescale to this planet's spin
      meshRef.current.rotation.y = clock.rotationAngle * (SIDEREAL_DAY_DAYS / data.rotationPeriodDays)
    }
  })

  // Explainers teach with Earth alone — other planets would clutter the view
  if (explainerActive) return null

  return (
    <>
      <OrbitPath
        semiMajorAxis={data.semiMajorAxis}
        eccentricity={data.eccentricity}
        perihelionAngleRad={((data.perihelionLongitudeDeg - EARTH_PERIHELION_LONGITUDE_DEG) * Math.PI) / 180}
      />
      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); useAppStore.getState().setFocusTarget(planet) }}
          onPointerDown={onPointerDown}
          onPointerOver={() => { document.body.style.cursor = useAppStore.getState().focusTarget === planet ? 'grab' : 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'auto' }}
        >
          <sphereGeometry args={[data.radius, 48, 48]} />
          <meshStandardMaterial map={texture} emissive="#181818" />
        </mesh>
      </group>
    </>
  )
}
