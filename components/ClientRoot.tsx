'use client'

import { useCallback, useMemo, useState, Suspense } from 'react'
import { SimulationContext, SimulationClock } from '@/components/canvas/SimulationContext'
import { CanvasErrorBoundary } from '@/components/canvas/ErrorBoundary'
import { Scene } from '@/components/canvas/Scene'
import { HUD } from '@/components/hud/HUD'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { TopLeftControls } from '@/components/ui/TopLeftControls'
import { dateToJulianDay } from '@/lib/orbitalMechanics'

export function ClientRoot() {
  const [sceneReady, setSceneReady] = useState(false)
  const [sceneFailed, setSceneFailed] = useState(false)
  // Single clock instance — shared between Scene (3D) and HUD (timeline scrub)
  const clock = useMemo<SimulationClock>(() => ({
    julianDay: dateToJulianDay(new Date()),
    rotationAngle: 0,
  }), [])
  const handleSceneReady = useCallback(() => {
    setSceneReady(true)
  }, [])
  const handleSceneError = useCallback(() => {
    setSceneFailed(true)
  }, [])

  return (
    <SimulationContext.Provider value={clock}>
      <CanvasErrorBoundary onError={handleSceneError}>
        <Suspense fallback={null}>
          <Scene isReady={sceneReady} onReady={handleSceneReady} />
        </Suspense>
      </CanvasErrorBoundary>
      {sceneReady && !sceneFailed ? (
        <>
          <TopLeftControls />
          <HUD />
        </>
      ) : null}
      <LoadingOverlay isReady={sceneReady || sceneFailed} />
    </SimulationContext.Provider>
  )
}
