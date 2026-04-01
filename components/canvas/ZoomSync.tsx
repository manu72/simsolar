'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useAppStore } from '@/store/useAppStore'

const _dir = new Vector3()

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

    // Reset pan offset when the user switches focus targets
    if (focusTarget !== prevFocusTarget.current) {
      const dist = camera.position.distanceTo(controls.target)
      _dir.copy(camera.position).sub(controls.target).normalize()
      controls.target.set(0, 0, 0)
      camera.position.copy(_dir).multiplyScalar(dist)
      controls.update()
      prevFocusTarget.current = focusTarget
    }

    // Distance from camera to orbit pivot (accounts for pan offset)
    const cameraDistance = camera.position.distanceTo(controls.target)

    if (Math.abs(zoomDistance - lastStoreDistance.current) > 0.5) {
      // Slider driving zoom — scale camera-to-target distance, preserving direction
      _dir.copy(camera.position).sub(controls.target).normalize()
      camera.position.copy(controls.target).addScaledVector(_dir, zoomDistance)
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
