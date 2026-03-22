'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import '@react-three/fiber'
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

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    return geo
  }, [points])

  return (
    <threeLine geometry={geometry}>
      <lineBasicMaterial color="#4488aa" transparent opacity={0.3} />
    </threeLine>
  )
}
