'use client'

import Image from 'next/image'

interface LoadingOverlayProps {
  isReady: boolean
}

export function LoadingOverlay({ isReady }: LoadingOverlayProps) {
  return (
    <section
      aria-hidden={isReady}
      aria-busy={!isReady}
      aria-label="Solar system loading"
      aria-live="polite"
      className={`solar-loading-overlay ${isReady ? 'solar-loading-overlay--departing' : ''}`}
    >
      <div className="solar-loading-rocket-field" aria-hidden="true">
        <div className={`solar-loading-rocket ${isReady ? 'solar-loading-rocket--departing' : ''}`}>
          <Image
            src="/icons/rocket-100x96.png"
            alt=""
            width={100}
            height={96}
            priority
            unoptimized
          />
        </div>
      </div>

      <div className="solar-loading-card" role="status">
        <p className="solar-loading-eyebrow">SolarSim is preparing your view</p>
        <h1 className="solar-loading-title">Please wait while we position the cameras...</h1>
        <p className="solar-loading-copy">
          Loading Earth textures and aligning the first orbit frame.
        </p>
      </div>
    </section>
  )
}
