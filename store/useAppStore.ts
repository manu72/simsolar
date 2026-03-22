import { create } from 'zustand'
import { DEFAULT_ORBIT_SPEED, DEFAULT_ROTATION_SPEED } from '@/lib/constants'

interface AppState {
  isPlaying: boolean
  orbitSpeed: number
  rotationSpeed: number
  displayDate: Date
  hemisphere: 'north' | 'south'

  setIsPlaying: (v: boolean) => void
  setOrbitSpeed: (v: number) => void
  setRotationSpeed: (v: number) => void
  setDisplayDate: (d: Date) => void
  setHemisphere: (h: 'north' | 'south') => void
}

export const useAppStore = create<AppState>((set) => ({
  isPlaying: true,
  orbitSpeed: DEFAULT_ORBIT_SPEED,
  rotationSpeed: DEFAULT_ROTATION_SPEED,
  displayDate: new Date(),
  hemisphere: 'south',

  setIsPlaying: (v) => set({ isPlaying: v }),
  setOrbitSpeed: (v) => set({ orbitSpeed: Math.max(0, Math.min(50, v)) }),
  setRotationSpeed: (v) => set({ rotationSpeed: Math.max(0, Math.min(100, v)) }),
  setDisplayDate: (d) => set({ displayDate: d }),
  setHemisphere: (h) => set({ hemisphere: h }),
}))
