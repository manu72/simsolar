'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import '@react-three/fiber'
import {
  MOON_RADIUS,
  MOON_INCLINATION_RAD,
  MOON_AXIAL_TILT_RAD,
  MOON_ORBIT_RADIUS,
} from '@/lib/constants'

const ORBIT_SEGMENTS = 128

interface MoonProps {
  groupRef: React.RefObject<THREE.Group | null>
  inclinationGroupRef: React.RefObject<THREE.Group | null>
}

export function Moon({ groupRef, inclinationGroupRef }: MoonProps) {
  const orbitGeometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,
      MOON_ORBIT_RADIUS, MOON_ORBIT_RADIUS,
      0, 2 * Math.PI,
      false,
      0,
    )
    const pts = curve.getPoints(ORBIT_SEGMENTS)
    const points = pts.map(p => new THREE.Vector3(p.x, 0, p.y))
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  return (
    <group ref={inclinationGroupRef} rotation={[MOON_INCLINATION_RAD, 0, 0]}>
      {/* Orbital path indicator */}
      <threeLine geometry={orbitGeometry}>
        <lineBasicMaterial color="#666" transparent opacity={0.25} />
      </threeLine>
      {/* groupRef controls position (orbit) and rotation.y (tidal lock) via Animator */}
      <group ref={groupRef}>
        {/* Axial tilt is visual only — does not affect orbital position */}
        <mesh rotation={[0, 0, -MOON_AXIAL_TILT_RAD]}>
          <sphereGeometry args={[MOON_RADIUS, 32, 32]} />
          <meshStandardMaterial color="#aaa" emissive="#333" />
        </mesh>
      </group>
    </group>
  )
}
