'use client'

import { Html } from '@react-three/drei'
import { useAppStore } from '@/store/useAppStore'

const HTML_STYLE: React.CSSProperties = { pointerEvents: 'none' }
// Keep labels below the HUD overlay (drei's default z-index is ~16M)
const HTML_Z_INDEX_RANGE: [number, number] = [0, 0]

/**
 * NASA-Eyes-style body name label: constant screen-size (no distanceFactor,
 * so it never scales with camera zoom), gated by the HUD Labels toggle and
 * hidden while a season explainer is active.
 */
export function BodyLabel({ name, offsetY }: { name: string; offsetY: number }) {
  const showOrbitalLabels = useAppStore(s => s.showOrbitalLabels)
  const explainerActive = useAppStore(s => Boolean(s.activeSeasonExplainer))

  if (!showOrbitalLabels || explainerActive) return null

  return (
    <Html position={[0, offsetY, 0]} center style={HTML_STYLE} zIndexRange={HTML_Z_INDEX_RANGE}>
      <div
        className="text-[11px] uppercase tracking-[0.25em] text-gray-300 whitespace-nowrap select-none"
        style={{ textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
      >
        {name}
      </div>
    </Html>
  )
}
