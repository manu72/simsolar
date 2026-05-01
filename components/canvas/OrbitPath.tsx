'use client'

import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { SEMI_MAJOR_AXIS, SEMI_MINOR_AXIS } from '@/lib/constants'

const SEGMENTS = 256

export function OrbitPath() {
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,                        // center
      SEMI_MAJOR_AXIS,             // x radius (semi-major)
      SEMI_MINOR_AXIS,             // y radius (semi-minor)
      0, 2 * Math.PI,
      false,
      0,
    )
    const pts = curve.getPoints(SEGMENTS)
    // EllipseCurve returns points in XY plane; rotate to XZ (ecliptic)
    return pts.map(p => new THREE.Vector3(p.x, 0, p.y))
  }, [])

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
