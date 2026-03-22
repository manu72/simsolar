'use client'

import { SUN_RADIUS } from '@/lib/constants'

export function Sun() {
  return (
    <>
      {/* Point light that illuminates Earth */}
      <pointLight
        intensity={2.5}
        distance={600}
        decay={1}
        color="#fff5e0"
      />
      {/* Sun mesh — MeshBasicMaterial avoids self-lighting artifact */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#ffa500" />
      </mesh>
    </>
  )
}
