'use client'

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react'

interface OfflineStatus {
  isOffline: boolean
  isCached: boolean
  cacheProgress: number
  cacheError: string | null
  triggerCache: () => void
}

// COUPLED: must match TEXTURE_CACHE in public/sw.js
const TEXTURE_CACHE_NAME = 'solarsim-textures-v2'
const EXPECTED_TEXTURE_COUNT = 3

// Cache name prefixes owned by this app (current and legacy), purged in dev.
const APP_CACHE_PREFIXES = ['solarsim-', 'solstice-']

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}
function getOnlineSnapshot() { return !navigator.onLine }
function getServerSnapshot() { return false }

export function useOfflineStatus(): OfflineStatus {
  const isOffline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerSnapshot)
  const [isCached, setIsCached] = useState(false)
  const [cacheProgress, setCacheProgress] = useState(0)
  const [cacheError, setCacheError] = useState<string | null>(null)

  useEffect(() => {
    // The service worker must never run in development: dev chunk URLs are
    // not content-hashed, so its cache-first strategy serves stale code
    // forever. Self-heal by unregistering any existing SW and purging caches.
    if (!IS_PRODUCTION) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
          .catch(() => {})
      }
      if ('caches' in window) {
        caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => APP_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)))
                .map((key) => caches.delete(key)),
            ),
          )
          .catch(() => {})
      }
      return
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    if ('caches' in window) {
      caches
        .open(TEXTURE_CACHE_NAME)
        .then((cache) =>
          cache.keys().then((keys) => {
            if (keys.length >= EXPECTED_TEXTURE_COUNT) {
              setIsCached(true)
              setCacheProgress(100)
            }
          }),
        )
        .catch(() => {})
    }
  }, [])

  const triggerCache = useCallback(() => {
    // No SW is registered in development, so `serviceWorker.ready` would
    // never resolve — bail out instead of leaving a dangling promise.
    if (!IS_PRODUCTION || !('serviceWorker' in navigator) || isCached) return

    setCacheError(null)

    navigator.serviceWorker.ready.then((registration) => {
      const channel = new MessageChannel()
      channel.port1.onmessage = (event) => {
        const { type, completed, total, error } = event.data
        if (type === 'PROGRESS') {
          setCacheProgress(Math.round((completed / total) * 100))
        } else if (type === 'DONE') {
          setIsCached(true)
          setCacheProgress(100)
        } else if (type === 'ERROR') {
          setCacheError(error ?? 'Caching failed')
        }
      }
      registration.active?.postMessage({ type: 'PRECACHE_TEXTURES' }, [channel.port2])
    })
  }, [isCached])

  return { isOffline, isCached, cacheProgress, cacheError, triggerCache }
}
