import { create } from 'zustand'
import { DEFAULT_ORBIT_SPEED, DEFAULT_ROTATION_SPEED, MAX_ORBIT_SPEED, MAX_ROTATION_SPEED } from '@/lib/constants'

interface AppState {
  isPlaying: boolean
  orbitSpeed: number
  rotationSpeed: number
  hemisphere: 'north' | 'south'

  setIsPlaying: (v: boolean) => void
  setOrbitSpeed: (v: number) => void
  setRotationSpeed: (v: number) => void
  setHemisphere: (h: 'north' | 'south') => void
}

export const useAppStore = create<AppState>((set) => ({
  isPlaying: true,
  orbitSpeed: DEFAULT_ORBIT_SPEED,
  rotationSpeed: DEFAULT_ROTATION_SPEED,
  hemisphere: 'south',

  setIsPlaying: (v) => set({ isPlaying: v }),
  setOrbitSpeed: (v) => set({ orbitSpeed: Math.max(0, Math.min(MAX_ORBIT_SPEED, v)) }),
  setRotationSpeed: (v) => set({ rotationSpeed: Math.max(0, Math.min(MAX_ROTATION_SPEED, v)) }),
  setHemisphere: (h) => set({ hemisphere: h }),
}))
