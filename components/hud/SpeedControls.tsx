'use client'

import { useAppStore } from '@/store/useAppStore'
import { MAX_ORBIT_SPEED, MAX_ROTATION_SPEED } from '@/lib/constants'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

function SpeedSlider({ label, value, min, max, onChange }: SliderProps) {
  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-[8px] uppercase tracking-wider text-gray-500">{label}</span>
        <span className="text-[8px] text-blue-300">{value}×</span>
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
  const setOrbitSpeed    = useAppStore(s => s.setOrbitSpeed)
  const setRotationSpeed = useAppStore(s => s.setRotationSpeed)

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
    </>
  )
}
