import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// public/sw.js and lib/useOfflineStatus.ts each declare the texture cache
// name (a service worker cannot import from the app bundle). This test
// guards the coupling so the two constants cannot silently drift apart.

function extractConstant(source: string, name: string, file: string): string {
  const match = source.match(new RegExp(`const ${name} = '([^']+)'`))
  if (!match) throw new Error(`Could not find constant ${name} in ${file}`)
  return match[1]
}

describe('service worker cache name coupling', () => {
  const swSource = readFileSync(resolve(__dirname, '../public/sw.js'), 'utf8')
  const hookSource = readFileSync(resolve(__dirname, '../lib/useOfflineStatus.ts'), 'utf8')

  it('uses the same texture cache name in sw.js and useOfflineStatus.ts', () => {
    const swName = extractConstant(swSource, 'TEXTURE_CACHE', 'public/sw.js')
    const hookName = extractConstant(hookSource, 'TEXTURE_CACHE_NAME', 'lib/useOfflineStatus.ts')
    expect(hookName).toBe(swName)
  })

  it('keeps all cache names within prefixes purged by the dev self-heal', () => {
    const prefixesMatch = hookSource.match(/const APP_CACHE_PREFIXES = \[([^\]]+)\]/)
    if (!prefixesMatch) throw new Error('Could not find APP_CACHE_PREFIXES in lib/useOfflineStatus.ts')
    const prefixes = [...prefixesMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])

    const staticName = extractConstant(swSource, 'CACHE_NAME', 'public/sw.js')
    const textureName = extractConstant(swSource, 'TEXTURE_CACHE', 'public/sw.js')

    for (const cacheName of [staticName, textureName]) {
      expect(
        prefixes.some((prefix) => cacheName.startsWith(prefix)),
        `${cacheName} is not covered by APP_CACHE_PREFIXES ${JSON.stringify(prefixes)}`,
      ).toBe(true)
    }
  })
})
