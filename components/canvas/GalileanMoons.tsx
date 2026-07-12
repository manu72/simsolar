'use client'

import { useContext, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { GALILEAN_MOON_DATA, J2000_JD, type GalileanMoonId } from '@/lib/constants'
import { useAppStore } from '@/store/useAppStore'
import { SimulationContext } from './SimulationContext'
import { BodyLabel } from './BodyLabel'

const ORBIT_SEGMENTS = 96

/**
 * One Galilean moon: circular clock-driven orbit in Jupiter's local frame
 * (rendered inside Jupiter's scaled group, so position/scale/reference frame
 * are inherited — same parenting pattern as Earth's Moon). Tidally locked.
 * ponytail: circular orbits in the ecliptic plane — real eccentricities are
 * ≤0.009 and inclinations ≤0.5°, add them if out-of-plane accuracy matters.
 */
function GalileanMoon({ moon }: { moon: GalileanMoonId }) {
  const clock = useContext(SimulationContext)
  const groupRef = useRef<THREE.Group>(null)
  const data = GALILEAN_MOON_DATA[moon]
  const texture = useTexture(data.texture, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
  })
  // Labels only while Jupiter is focused — at system zoom four extra labels
  // would pile onto Jupiter's own
  const showLabel = useAppStore(s => s.focusTarget === 'jupiter')

  const orbitPoints = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,
      data.orbitRadius, data.orbitRadius,
      0, 2 * Math.PI,
      false,
      0,
    )
    return curve.getPoints(ORBIT_SEGMENTS).map(p => new THREE.Vector3(p.x, 0, p.y))
  }, [data.orbitRadius])

  useFrame(() => {
    if (!groupRef.current) return
    const theta =
      (data.meanLongitudeDeg * Math.PI) / 180 +
      (2 * Math.PI * (clock.julianDay - J2000_JD)) / data.periodDays
    groupRef.current.position.set(
      data.orbitRadius * Math.cos(theta),
      0,
      data.orbitRadius * Math.sin(theta),
    )
    // Tidally locked — same sign convention as Earth's Moon
    groupRef.current.rotation.y = -theta + Math.PI
  })

  return (
    <>
      <Line
        points={orbitPoints}
        color="#666"
        lineWidth={1}
        transparent
        opacity={0.25}
      />
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[data.radius, 32, 32]} />
          <meshStandardMaterial map={texture} emissive="#181818" />
        </mesh>
        {showLabel && <BodyLabel name={moon} offsetY={data.radius * 2.5} />}
      </group>
    </>
  )
}

export function GalileanMoons() {
  return (
    <>
      <GalileanMoon moon="io" />
      <GalileanMoon moon="europa" />
      <GalileanMoon moon="ganymede" />
      <GalileanMoon moon="callisto" />
    </>
  )
}
