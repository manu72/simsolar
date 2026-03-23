'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SUN_RADIUS } from '@/lib/constants'
import { useAppStore } from '@/store/useAppStore'
import sunSurfaceVert from '@/lib/shaders/sunSurface.vert'
import sunSurfaceFrag from '@/lib/shaders/sunSurface.frag'
import sunGlowVert from '@/lib/shaders/sunGlow.vert'
import sunGlowFrag from '@/lib/shaders/sunGlow.frag'

const GLOW_COLOR = new THREE.Vector3(1.0, 0.6, 0.1)

export function Sun() {
  const surfaceRef = useRef<THREE.ShaderMaterial>(null)

  const surfaceUniforms = useMemo(
    () => ({ uTime: { value: 0 } }),
    [],
  )

  const glowUniforms = useMemo(
    () => ({
      uColor: { value: GLOW_COLOR },
      uIntensity: { value: 1.2 },
    }),
    [],
  )

  useFrame((_, delta) => {
    if (surfaceRef.current) {
      surfaceRef.current.uniforms.uTime.value += delta
    }
  })

  return (
    <>
      <pointLight
        intensity={2.5}
        distance={600}
        decay={1}
        color="#fff5e0"
      />
      {/* Animated sun core */}
      <mesh
        onClick={() => useAppStore.getState().toggleFocusTarget()}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <shaderMaterial
          ref={surfaceRef}
          vertexShader={sunSurfaceVert}
          fragmentShader={sunSurfaceFrag}
          uniforms={surfaceUniforms}
        />
      </mesh>
      {/* TODO: glow effect — removed for now, needs better approach */}
    </>
  )
}
