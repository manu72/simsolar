'use client'

import { useContext, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { PLANET_DATA, SIDEREAL_DAY_DAYS, EARTH_PERIHELION_LONGITUDE_DEG, DEFAULT_EARTH_SCALE, SATURN_RING_INNER, SATURN_RING_OUTER, type PlanetId } from '@/lib/constants'
import { getPlanetOrbitalPosition, compressDisplayPosition } from '@/lib/orbitalMechanics'
import { BodyLabel } from './BodyLabel'
import { useAppStore } from '@/store/useAppStore'
import { usePlanetDrag } from '@/lib/usePlanetDrag'
import { SimulationContext } from './SimulationContext'
import { OrbitPath } from './OrbitPath'

interface PlanetProps {
  planet: PlanetId
}

/**
 * A textured planet plus its orbit path. Rendered inside worldGroup,
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
      groupRef.current.position.copy(compressDisplayPosition(getPlanetOrbitalPosition(planet, clock.julianDay)))
      // Planet Scale only applies to the focused planet
      groupRef.current.scale.setScalar(focusTarget === planet ? earthScale : DEFAULT_EARTH_SCALE)
    }
    if (meshRef.current) {
      // clock.rotationAngle is 2π per Earth sidereal day; rescale to this planet's spin
      meshRef.current.rotation.y = clock.rotationAngle * (SIDEREAL_DAY_DAYS / data.rotationPeriodDays)
    }
  })

  // The mesh unmounts while hidden, so onPointerOut can't fire — clear any
  // hover cursor left behind (e.g. explainer opened via keyboard mid-hover)
  useEffect(() => {
    if (explainerActive) document.body.style.cursor = 'auto'
  }, [explainerActive])

  // Explainers teach with Earth alone — other planets would clutter the view
  if (explainerActive) return null

  return (
    <>
      <OrbitPath
        semiMajorAxis={data.semiMajorAxis}
        eccentricity={data.eccentricity}
        perihelionAngleRad={((data.perihelionLongitudeDeg - EARTH_PERIHELION_LONGITUDE_DEG) * Math.PI) / 180}
        color={data.color}
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
        {/* ponytail: flat-colour untilted ring — swap in a ring texture and
            Saturn's 26.7° axial tilt if visual fidelity ever matters */}
        {planet === 'saturn' && (
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[data.radius * SATURN_RING_INNER, data.radius * SATURN_RING_OUTER, 96]} />
            <meshBasicMaterial color="#c7b487" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
        )}
        <BodyLabel name={planet} offsetY={data.radius * 1.6} />
      </group>
    </>
  )
}
