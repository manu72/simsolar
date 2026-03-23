'use client'

import { useAppStore } from '@/store/useAppStore'
import { MAX_ORBIT_SPEED, MAX_ROTATION_SPEED, MIN_ZOOM_DISTANCE, MAX_ZOOM_DISTANCE } from '@/lib/constants'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (v: number) => void
}

function SpeedSlider({ label, value, min, max, suffix = '×', onChange }: SliderProps) {
  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
        <span className="text-xs text-blue-300">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-800 rounded appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-blue-400"
      />
    </div>
  )
}

export function SpeedControls() {
  const orbitSpeed    = useAppStore(s => s.orbitSpeed)
  const rotationSpeed = useAppStore(s => s.rotationSpeed)
  const zoomDistance   = useAppStore(s => s.zoomDistance)
  const setOrbitSpeed    = useAppStore(s => s.setOrbitSpeed)
  const setRotationSpeed = useAppStore(s => s.setRotationSpeed)
  const setZoomDistance   = useAppStore(s => s.setZoomDistance)

  return (
    <>
      <SpeedSlider
        label="Orbit Speed"
        value={orbitSpeed}
        min={0}
        max={MAX_ORBIT_SPEED}
        onChange={setOrbitSpeed}
      />
      <SpeedSlider
        label="Rotation Speed"
        value={rotationSpeed}
        min={0}
        max={MAX_ROTATION_SPEED}
        onChange={setRotationSpeed}
      />
      <SpeedSlider
        label="Zoom"
        value={zoomDistance}
        min={MIN_ZOOM_DISTANCE}
        max={MAX_ZOOM_DISTANCE}
        suffix=""
        onChange={setZoomDistance}
      />
    </>
  )
}
