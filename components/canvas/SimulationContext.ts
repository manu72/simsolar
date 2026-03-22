import { createContext } from 'react'
import { dateToJulianDay } from '@/lib/orbitalMechanics'

export type SimulationClock = {
  julianDay: number      // current simulation time — written every frame
  rotationAngle: number  // accumulated Earth rotation in radians
}

// Fallback default — consumers must be wrapped in a SimulationContext.Provider
export const SimulationContext = createContext<SimulationClock>({
  julianDay: dateToJulianDay(new Date()),
  rotationAngle: 0,
})
