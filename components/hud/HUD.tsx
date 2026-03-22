'use client'

import { useAppStore } from '@/store/useAppStore'
import { TimelineSlider } from './TimelineSlider'
import { SpeedControls } from './SpeedControls'
import { PlanetSelector } from './PlanetSelector'
import { HemisphereControl } from './HemisphereControl'

export function HUD() {
  const isPlaying  = useAppStore(s => s.isPlaying)
  const setPlaying = useAppStore(s => s.setIsPlaying)

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-black/85 backdrop-blur-md
        border-t border-white/[0.06]
        px-4 py-3
      "
    >
      {/* Row 1 — Timeline */}
      <div className="relative mb-3">
        <TimelineSlider />
      </div>

      {/* Row 2 — Controls */}
      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
        {/* Play/pause */}
        <button
          onClick={() => setPlaying(!isPlaying)}
          className="
            flex-shrink-0 w-8 h-8 rounded-full
            bg-blue-900/30 border border-blue-500/30
            text-blue-300 hover:bg-blue-900/50
            flex items-center justify-center
            transition-colors
          "
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <SpeedControls />
        <HemisphereControl />
        <PlanetSelector />
      </div>
    </div>
  )
}
