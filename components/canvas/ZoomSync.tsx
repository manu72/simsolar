'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAppStore } from '@/store/useAppStore'

export function ZoomSync() {
  const camera = useThree(s => s.camera)
  const lastStoreDistance = useRef(useAppStore.getState().zoomDistance)

  useFrame(() => {
    const { zoomDistance, setZoomDistance } = useAppStore.getState()
    const cameraDistance = camera.position.length()

    // If the store changed (slider moved), move the camera
    if (Math.abs(zoomDistance - lastStoreDistance.current) > 0.5) {
      const scale = zoomDistance / cameraDistance
      camera.position.multiplyScalar(scale)
      lastStoreDistance.current = zoomDistance
    } else {
      // Otherwise sync store from camera (mouse wheel zoom)
      const rounded = Math.round(cameraDistance)
      if (Math.abs(rounded - zoomDistance) > 1) {
        setZoomDistance(rounded)
      }
      lastStoreDistance.current = rounded
    }
  })

  return null
}
