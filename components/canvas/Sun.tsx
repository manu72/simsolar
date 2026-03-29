"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { SUN_RADIUS } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import sunSurfaceVert from "@/lib/shaders/sunSurface.vert";
import sunSurfaceFrag from "@/lib/shaders/sunSurface.frag";

const HTML_STYLE: React.CSSProperties = { pointerEvents: "none" };
const HTML_Z_INDEX_RANGE: [number, number] = [0, 0];
const GLOW_STYLE: React.CSSProperties = {
  width: "400px",
  height: "400px",
  borderRadius: "50%",
  background:
    "radial-gradient(circle, rgba(255,190,70,0.45) 0%, rgba(255,150,35,0.2) 30%, rgba(255,110,15,0.08) 60%, transparent 100%)",
  pointerEvents: "none",
  mixBlendMode: "screen",
};

export function Sun() {
  const surfaceRef = useRef<THREE.ShaderMaterial>(null);

  const surfaceUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useEffect(() => () => { document.body.style.cursor = "auto"; }, []);

  useFrame((_, delta) => {
    if (surfaceRef.current) {
      surfaceRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <>
      <pointLight intensity={2} distance={0} decay={0} color="#fff5e0" />
      {/* Animated sun core */}
      <mesh
        onClick={(e) => { e.stopPropagation(); useAppStore.getState().setFocusTarget('sun') }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <shaderMaterial
          ref={surfaceRef}
          vertexShader={sunSurfaceVert}
          fragmentShader={sunSurfaceFrag}
          uniforms={surfaceUniforms}
        />
      </mesh>
      {/* CSS radial gradient glow */}
      <Html center distanceFactor={40} style={HTML_STYLE} zIndexRange={HTML_Z_INDEX_RANGE}>
        <div style={GLOW_STYLE} />
      </Html>
    </>
  );
}
