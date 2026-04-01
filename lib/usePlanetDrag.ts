'use client'

import { useRef, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import { useAppStore } from '@/store/useAppStore'

interface PanControls {
  target: Vector3
  enabled: boolean
  update: () => void
}

const _right = new Vector3()
const _up = new Vector3()

/**
 * Allows the user to left-click (or single-finger touch) drag the focused
 * planet to reposition it on screen. Non-focused planets ignore the drag
 * and fall through to normal OrbitControls orbit behaviour.
 *
 * Translates both camera and OrbitControls target so the orbit pivot
 * follows the visual offset. Resets automatically on focus change
 * (handled by ZoomSync).
 */
export function usePlanetDrag(identity: 'sun' | 'earth' | 'moon') {
  const camera = useThree(s => s.camera)
  const size = useThree(s => s.size)
  const controls = useThree(s => s.controls) as PanControls | null
  const controlsRef = useRef(controls)
  controlsRef.current = controls

  const dragging = useRef(false)
  const lastXY = useRef({ x: 0, y: 0 })

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    // Prevent R3F from propagating to meshes behind (mirrors onClick pattern)
    e.stopPropagation()

    if (useAppStore.getState().focusTarget !== identity) return

    dragging.current = true
    lastXY.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }

    const ctrl = controlsRef.current
    if (ctrl) ctrl.enabled = false
    document.body.style.cursor = 'grabbing'

    const onMove = (ev: PointerEvent) => {
      if (!dragging.current) return
      const ctrl = controlsRef.current
      if (!ctrl) return

      const dx = ev.clientX - lastXY.current.x
      const dy = ev.clientY - lastXY.current.y
      lastXY.current = { x: ev.clientX, y: ev.clientY }

      const dist = camera.position.distanceTo(ctrl.target)
      const fov = (camera as PerspectiveCamera).fov * Math.PI / 180
      const pixelScale = (2 * dist * Math.tan(fov / 2)) / size.height

      _right.setFromMatrixColumn(camera.matrixWorld, 0)
      _up.setFromMatrixColumn(camera.matrixWorld, 1)

      ctrl.target.addScaledVector(_right, -dx * pixelScale)
      ctrl.target.addScaledVector(_up, dy * pixelScale)
      camera.position.addScaledVector(_right, -dx * pixelScale)
      camera.position.addScaledVector(_up, dy * pixelScale)
    }

    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = 'auto'
      const ctrl = controlsRef.current
      if (ctrl) ctrl.enabled = true
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [camera, identity, size])

  return { onPointerDown }
}
