'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useAppStore } from '@/store/useAppStore'
import { resetPanToOrigin, zoomToDistance } from '@/lib/cameraMath'

interface ZoomSyncProps {
  controlsRef: React.RefObject<{ target: Vector3; update: () => void } | null>
}

export function ZoomSync({ controlsRef }: ZoomSyncProps) {
  const camera = useThree(s => s.camera)
  const lastStoreDistance = useRef(useAppStore.getState().zoomDistance)
  const prevFocusTarget = useRef(useAppStore.getState().focusTarget)

  useFrame(() => {
    const controls = controlsRef.current
    if (!controls) return

    const { zoomDistance, setZoomDistance, focusTarget } = useAppStore.getState()

    if (focusTarget !== prevFocusTarget.current) {
      resetPanToOrigin(camera.position, controls.target)
      controls.update()
      prevFocusTarget.current = focusTarget
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
