'use client'

import { useMemo } from 'react'
import { Line, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import {
  MOON_RADIUS,
  MOON_INCLINATION_RAD,
  MOON_AXIAL_TILT_RAD,
  MOON_ORBIT_RADIUS,
} from '@/lib/constants'
import { useAppStore } from '@/store/useAppStore'
import { usePlanetDrag } from '@/lib/usePlanetDrag'

const ORBIT_SEGMENTS = 128

interface MoonProps {
  groupRef: React.RefObject<THREE.Group | null>
  inclinationGroupRef: React.RefObject<THREE.Group | null>
}

export function Moon({ groupRef, inclinationGroupRef }: MoonProps) {
  const { onPointerDown } = usePlanetDrag('moon')
  const explainerActive = useAppStore(s => Boolean(s.activeSeasonExplainer))
  const moonTexture = useTexture('/textures/moon.jpg')

  const orbitPoints = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,
      MOON_ORBIT_RADIUS, MOON_ORBIT_RADIUS,
      0, 2 * Math.PI,
      false,
      0,
    )
    const pts = curve.getPoints(ORBIT_SEGMENTS)
    return pts.map(p => new THREE.Vector3(p.x, 0, p.y))
  }, [])

  // Explainers teach with Earth alone — the spinning globe would otherwise
  // carry the Moon across the camera view mid-lesson
  if (explainerActive) return null

  return (
    <group ref={inclinationGroupRef} rotation={[MOON_INCLINATION_RAD, 0, 0]}>
      {/* Orbital path indicator */}
      <Line
        points={orbitPoints}
        color="#666"
        lineWidth={1}
        transparent
        opacity={0.25}
      />
      {/* groupRef controls position (orbit) and rotation.y (tidal lock) via Animator */}
      <group ref={groupRef}>
        {/* Axial tilt is visual only — does not affect orbital position */}
        <mesh
          rotation={[0, 0, -MOON_AXIAL_TILT_RAD]}
          onClick={(e) => { e.stopPropagation(); useAppStore.getState().setFocusTarget('moon') }}
          onPointerDown={onPointerDown}
          onPointerOver={() => { document.body.style.cursor = useAppStore.getState().focusTarget === 'moon' ? 'grab' : 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'auto' }}
        >
          <sphereGeometry args={[MOON_RADIUS, 32, 32]} />
          <meshStandardMaterial map={moonTexture} emissive="#181818" />
        </mesh>
      </group>
    </group>
  )
}
