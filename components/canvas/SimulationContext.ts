import { createContext } from 'react'
import { dateToJulianDay } from '@/lib/orbitalMechanics'

export type SimulationClock = {
  julianDay: number      // current simulation time — written every frame
  rotationAngle: number  // accumulated Earth rotation in radians
}

export const SimulationContext = createContext<SimulationClock>({
  julianDay: dateToJulianDay(new Date()),
  rotationAngle: 0,
})
