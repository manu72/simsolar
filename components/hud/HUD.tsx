'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { TimelineSlider } from './TimelineSlider'
import { SpeedControls } from './SpeedControls'
import { PlanetSelector } from './PlanetSelector'
import { HemisphereControl } from './HemisphereControl'
import { LabelsControl } from './LabelsControl'

export function HUD() {
  const isPlaying  = useAppStore(s => s.isPlaying)
  const setPlaying = useAppStore(s => s.setIsPlaying)
  const hudRef = useRef<HTMLDivElement>(null)

  // Publish --hud-height CSS variable + custom event for the explainer panel
  useEffect(() => {
    const rootEl = hudRef.current
    if (!rootEl) return

    let observer: ResizeObserver | null = null

    const update = () => {
      const h = rootEl.clientHeight
      document.documentElement.style.setProperty('--hud-height', `${h}px`)
      document.dispatchEvent(new CustomEvent('solar:hud-height', { detail: h }))
    }

    observer = new ResizeObserver(update)
    observer.observe(rootEl, { box: 'content-box' })
    update() // initial read

    return () => observer?.disconnect()
  }, [])

  return (
    <div
      ref={hudRef}
      data-hud-root
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
        <LabelsControl />
        <PlanetSelector />
      </div>
    </div>
  )
}
