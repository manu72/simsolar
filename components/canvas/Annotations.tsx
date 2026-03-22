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
  const labels = hemisphere === 'south' ? SOUTH_LABELS : NORTH_LABELS

  const events = useMemo(() => getSolsticeEquinoxEvents(), [])

  return (
    <>
      {events.map(event => {
        const pos = getEarthOrbitalPosition(event.jd)
        return (
          <Html
            key={event.label}
            position={[pos.x, pos.y + 6, pos.z]}
            center
            distanceFactor={80}
          >
            <div className="text-xs text-blue-200 bg-black/40 px-2 py-1 rounded whitespace-nowrap border border-blue-900/40 pointer-events-none">
              {labels[event.label]}
            </div>
          </Html>
        )
      })}
    </>
  )
}
