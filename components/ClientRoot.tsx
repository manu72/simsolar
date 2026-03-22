'use client'

import { useMemo, Suspense } from 'react'
import { SimulationContext, SimulationClock } from '@/components/canvas/SimulationContext'
import { CanvasErrorBoundary } from '@/components/canvas/ErrorBoundary'
import { Scene } from '@/components/canvas/Scene'
import { HUD } from '@/components/hud/HUD'
import { dateToJulianDay } from '@/lib/orbitalMechanics'

export function ClientRoot() {
  // Single clock instance — shared between Scene (3D) and HUD (timeline scrub)
  const clock = useMemo<SimulationClock>(() => ({
    julianDay: dateToJulianDay(new Date()),
    rotationAngle: 0,
  }), [])

  return (
    <SimulationContext.Provider value={clock}>
      <CanvasErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center bg-black">
              <p className="text-blue-300 text-sm tracking-widest uppercase animate-pulse">
                Loading…
              </p>
            </div>
          }
        >
          <Scene />
        </Suspense>
      </CanvasErrorBoundary>
      <HUD />
    </SimulationContext.Provider>
  )
}
