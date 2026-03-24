'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

interface OfflineStatus {
  isOffline: boolean
  isCached: boolean
  cacheProgress: number
  triggerCache: () => void
}

const TEXTURE_CACHE_NAME = 'solstice-textures-v1'
const EXPECTED_TEXTURE_COUNT = 3

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

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Check if textures are already cached
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
    if (!('serviceWorker' in navigator) || isCached) return

    navigator.serviceWorker.ready.then((registration) => {
      const channel = new MessageChannel()
      channel.port1.onmessage = (event) => {
        const { type, completed, total } = event.data
        if (type === 'PROGRESS') {
          setCacheProgress(Math.round((completed / total) * 100))
        } else if (type === 'DONE') {
          setIsCached(true)
          setCacheProgress(100)
        }
      }
      registration.active?.postMessage({ type: 'PRECACHE_TEXTURES' }, [channel.port2])
    })
  }, [isCached])

  return { isOffline, isCached, cacheProgress, triggerCache }
}
