'use client'

import { useContext, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { SimulationContext } from '@/components/canvas/SimulationContext'
import { useAppStore } from '@/store/useAppStore'
import { getSeasonExplainerCameraPosition, resetPanToOrigin, zoomToDistance } from '@/lib/cameraMath'
import { getEarthOrbitalPosition } from '@/lib/orbitalMechanics'
import { getSeasonExplainerEvent } from '@/lib/seasonExplainer'

interface ZoomSyncProps {
  controlsRef: React.RefObject<{ target: Vector3; update: () => void } | null>
}

interface CameraSnapshot {
  position: Vector3
  target: Vector3
}

export function ZoomSync({ controlsRef }: ZoomSyncProps) {
  const camera = useThree(s => s.camera)
  const clock = useContext(SimulationContext)
  const lastStoreDistance = useRef(useAppStore.getState().zoomDistance)
  const prevFocusTarget = useRef(useAppStore.getState().focusTarget)
  const explainerCameraSnapshot = useRef<CameraSnapshot | null>(null)
  const snappedExplainerKey = useRef<string | null>(null)

  useFrame(() => {
    const controls = controlsRef.current
    if (!controls) return

    const { zoomDistance, setZoomDistance, focusTarget, activeSeasonExplainer, hemisphere } = useAppStore.getState()

    if (activeSeasonExplainer) {
      if (!explainerCameraSnapshot.current) {
        explainerCameraSnapshot.current = {
          position: camera.position.clone(),
          target: controls.target.clone(),
        }
      }
    }

    if (focusTarget !== prevFocusTarget.current) {
      resetPanToOrigin(camera.position, controls.target)
      controls.update()
      prevFocusTarget.current = focusTarget
    }

    if (activeSeasonExplainer) {
      const event = getSeasonExplainerEvent(activeSeasonExplainer.eventLabel, hemisphere)
      const explainerKey = `${activeSeasonExplainer.eventLabel}:${hemisphere}:${clock.julianDay}`

      if (snappedExplainerKey.current !== explainerKey) {
        const earthPosition = getEarthOrbitalPosition(clock.julianDay)
        const [x, y, z] = getSeasonExplainerCameraPosition(
          event.viewPreset.cameraKind,
          earthPosition,
          zoomDistance,
        )

        controls.target.set(0, 0, 0)
        camera.position.set(x, y, z)
        controls.update()
        lastStoreDistance.current = zoomDistance
        snappedExplainerKey.current = explainerKey
      }
    } else if (explainerCameraSnapshot.current) {
      camera.position.copy(explainerCameraSnapshot.current.position)
      controls.target.copy(explainerCameraSnapshot.current.target)
      controls.update()
      explainerCameraSnapshot.current = null
      snappedExplainerKey.current = null
      lastStoreDistance.current = zoomDistance
    }

    const cameraDistance = camera.position.distanceTo(controls.target)

    if (Math.abs(zoomDistance - lastStoreDistance.current) > 0.5) {
      zoomToDistance(camera.position, controls.target, zoomDistance)
      lastStoreDistance.current = zoomDistance
    } else {
      const rounded = Math.round(cameraDistance)
      if (Math.abs(rounded - zoomDistance) > 1) {
        setZoomDistance(rounded)
      }
      lastStoreDistance.current = rounded
    }
  })

  return null
}
