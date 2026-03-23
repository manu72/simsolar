'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { SUN_RADIUS } from '@/lib/constants'
import { useAppStore } from '@/store/useAppStore'
import sunSurfaceVert from '@/lib/shaders/sunSurface.vert'
import sunSurfaceFrag from '@/lib/shaders/sunSurface.frag'

export function Sun() {
  const surfaceRef = useRef<THREE.ShaderMaterial>(null)

  const surfaceUniforms = useMemo(
    () => ({ uTime: { value: 0 } }),
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
      {/* CSS radial gradient glow — always works */}
      <Html
        center
        style={{ pointerEvents: 'none' }}
        zIndexRange={[0, 0]}
      >
        <div
          style={{
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,190,70,0.45) 0%, rgba(255,150,35,0.2) 30%, rgba(255,110,15,0.08) 60%, transparent 100%)',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        />
      </Html>
    </>
  )
}
