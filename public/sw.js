const CACHE_NAME = 'solstice-v1'
// COUPLED: must match TEXTURE_CACHE_NAME in lib/useOfflineStatus.ts
const TEXTURE_CACHE = 'solstice-textures-v1'
const TEXTURE_FILES = [
  '/textures/earth-day.jpg',
  '/textures/earth-night.jpg',
  '/textures/moon.jpg',
]

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== TEXTURE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/textures/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(TEXTURE_CACHE).then((cache) => cache.put(event.request, clone))
            }
            return response
          }),
      ),
    )
    return
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    /\.(js|css|woff2?|ttf|eot|svg|png|jpg|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            }
            return response
          }),
      ),
    )
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request)),
    )
    return
  }
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'PRECACHE_TEXTURES') return

  const port = event.ports[0]
  const total = TEXTURE_FILES.length
  let completed = 0

  caches
    .open(TEXTURE_CACHE)
    .then((cache) =>
      Promise.all(
        TEXTURE_FILES.map((url) =>
          cache.match(url).then((existing) => {
            if (existing) {
              completed++
              port.postMessage({ type: 'PROGRESS', completed, total })
              return
            }
            return fetch(url).then((response) => {
              if (!response.ok) {
                port.postMessage({ type: 'ERROR', error: `Failed to fetch ${url}: ${response.status}` })
                return
              }
              return cache.put(url, response).then(() => {
                completed++
                port.postMessage({ type: 'PROGRESS', completed, total })
              })
            })
          }),
        ),
      ),
    )
    .then(() => {
      if (completed === total) {
        port.postMessage({ type: 'DONE' })
      }
    })
    .catch((err) => port.postMessage({ type: 'ERROR', error: err.message }))
})
