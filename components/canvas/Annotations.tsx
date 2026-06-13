'use client'

import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { getSolsticeEquinoxEvents, getEarthOrbitalPosition } from '@/lib/orbitalMechanics'
import { useAppStore } from '@/store/useAppStore'

const SOUTH_LABELS: Record<string, string> = {
  'March Equinox':     'Mar 20 — Autumn Equinox',
  'June Solstice':     'Jun 21 — Winter Solstice',
  'September Equinox': 'Sep 23 — Spring Equinox',
  'December Solstice': 'Dec 21 — Summer Solstice',
}

const NORTH_LABELS: Record<string, string> = {
  'March Equinox':     'Mar 20 — Spring Equinox',
  'June Solstice':     'Jun 21 — Summer Solstice',
  'September Equinox': 'Sep 23 — Autumn Equinox',
  'December Solstice': 'Dec 21 — Winter Solstice',
}

export function Annotations() {
  const hemisphere = useAppStore(s => s.hemisphere)
  const activeExplainer = useAppStore(s => s.activeSeasonExplainer)
  const labels = hemisphere === 'south' ? SOUTH_LABELS : NORTH_LABELS

  const events = useMemo(() => getSolsticeEquinoxEvents(), [])

  // Positions must be stable references — new array every render causes Html's
  // useEffect to fire every render (referential equality), causing an infinite loop.
  const eventPositions = useMemo(() =>
    events.map(event => {
      const pos = getEarthOrbitalPosition(event.jd)
      return { ...event, position: [pos.x, pos.y + 6, pos.z] as [number, number, number] }
    }),
    [events],
  )

  return (
    <>
      {eventPositions.map(event => (
          <Html
            key={event.label}
            position={event.position}
            center
            distanceFactor={80}
          >
            <div className={getAnnotationClass(event.label === activeExplainer?.eventLabel, Boolean(activeExplainer))}>
              {labels[event.label]}
            </div>
          </Html>
      ))}
    </>
  )
}

function getAnnotationClass(active: boolean, explainerActive: boolean): string {
  if (active) {
    return 'text-xs font-semibold text-black bg-blue-200 px-2.5 py-1.5 rounded whitespace-nowrap border border-blue-100 pointer-events-none shadow-lg shadow-blue-900/40'
  }

  if (explainerActive) {
    return 'text-xs text-blue-200/35 bg-black/25 px-2 py-1 rounded whitespace-nowrap border border-blue-900/20 pointer-events-none'
  }

  return 'text-xs text-blue-200 bg-black/40 px-2 py-1 rounded whitespace-nowrap border border-blue-900/40 pointer-events-none'
}
