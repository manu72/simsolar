'use client'

import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { SEMI_MAJOR_AXIS, ECCENTRICITY } from '@/lib/constants'

const SEGMENTS = 256

interface OrbitPathProps {
  semiMajorAxis?: number
  eccentricity?: number
  /** Rotation of the perihelion axis in the scene frame (Earth's perihelion = 0) */
  perihelionAngleRad?: number
}

export function OrbitPath({
  semiMajorAxis = SEMI_MAJOR_AXIS,
  eccentricity = ECCENTRICITY,
  perihelionAngleRad = 0,
}: OrbitPathProps) {
  const points = useMemo(() => {
    const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity ** 2)
    // Sun sits at a focus, so the ellipse centre is offset by -a*e along the perihelion axis
    const cx = -semiMajorAxis * eccentricity * Math.cos(perihelionAngleRad)
    const cy = -semiMajorAxis * eccentricity * Math.sin(perihelionAngleRad)
    const curve = new THREE.EllipseCurve(
      cx, cy,
      semiMajorAxis,
      semiMinorAxis,
      0, 2 * Math.PI,
      false,
      perihelionAngleRad,
    )
    const pts = curve.getPoints(SEGMENTS)
    // EllipseCurve returns points in XY plane; rotate to XZ (ecliptic)
    return pts.map(p => new THREE.Vector3(p.x, 0, p.y))
  }, [semiMajorAxis, eccentricity, perihelionAngleRad])

  return (
    <Line
      points={points}
      color="#4488aa"
      lineWidth={1}
      transparent
      opacity={0.3}
    />
  )
}
