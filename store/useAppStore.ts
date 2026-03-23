import { create } from 'zustand'
import {
  DEFAULT_ORBIT_SPEED, DEFAULT_ROTATION_SPEED,
  MAX_ORBIT_SPEED, MAX_ROTATION_SPEED,
  MIN_ZOOM_DISTANCE, MAX_ZOOM_DISTANCE, DEFAULT_ZOOM_DISTANCE,
  MIN_EARTH_SCALE, MAX_EARTH_SCALE, DEFAULT_EARTH_SCALE,
} from '@/lib/constants'

interface AppState {
  isPlaying: boolean
  orbitSpeed: number
  rotationSpeed: number
  hemisphere: 'north' | 'south'
  zoomDistance: number
  earthScale: number
  focusTarget: 'sun' | 'earth'

  setIsPlaying: (v: boolean) => void
  setOrbitSpeed: (v: number) => void
  setRotationSpeed: (v: number) => void
  setHemisphere: (h: 'north' | 'south') => void
  setZoomDistance: (v: number) => void
  setEarthScale: (v: number) => void
  toggleFocusTarget: () => void
}

export const useAppStore = create<AppState>((set) => ({
  isPlaying: true,
  orbitSpeed: DEFAULT_ORBIT_SPEED,
  rotationSpeed: DEFAULT_ROTATION_SPEED,
  hemisphere: 'south',
  zoomDistance: DEFAULT_ZOOM_DISTANCE,
  earthScale: DEFAULT_EARTH_SCALE,
  focusTarget: 'sun',

  setIsPlaying: (v) => set({ isPlaying: v }),
  setOrbitSpeed: (v) => set({ orbitSpeed: Math.max(0, Math.min(MAX_ORBIT_SPEED, v)) }),
  setRotationSpeed: (v) => set({ rotationSpeed: Math.max(0, Math.min(MAX_ROTATION_SPEED, v)) }),
  setHemisphere: (h) => set({ hemisphere: h }),
  setZoomDistance: (v) => set({ zoomDistance: Math.max(MIN_ZOOM_DISTANCE, Math.min(MAX_ZOOM_DISTANCE, v)) }),
  setEarthScale: (v) => set({ earthScale: Math.max(MIN_EARTH_SCALE, Math.min(MAX_EARTH_SCALE, v)) }),
  toggleFocusTarget: () => set(s => ({ focusTarget: s.focusTarget === 'sun' ? 'earth' : 'sun' })),
}))
