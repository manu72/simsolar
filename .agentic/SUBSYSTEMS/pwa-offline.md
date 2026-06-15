<!-- agentic:managed:start -->
# pwa-offline

## Purpose
Opt-in offline asset caching via service worker — textures and static assets for classroom use.

## Owned paths
- `public/sw.js`
- `public/manifest.json`
- `public/icons/`
- `lib/useOfflineStatus.ts` (hook)

## Public contracts
- `public/sw.js` — fetch/cache strategy; cache names must stay coupled with tests
- `useOfflineStatus` — cache state and progress for UI
- `InfoModal` — user-facing offline caching toggle
- `vercel.json` — long-lived immutable cache for `/textures/*` in production

## Source-of-truth files
- `public/sw.js`
- `public/manifest.json`
- `lib/useOfflineStatus.ts`

## Related tests
- `__tests__/swCacheNames.test.ts` — cache name coupling with `public/sw.js`

## Dependencies
- `components/ui/InfoModal.tsx`
- `public/textures/` assets (~2MB)

## Invariants
- Guard every `cache.put()` with `response.ok` — 4xx/5xx must not poison cache
- Offline is opt-in via info modal, not automatic on first load

## Common failure modes
- Caching error responses → broken offline loads on revisit
- Renaming cache buckets in `sw.js` without updating `swCacheNames.test.ts`

## Do-not-do rules
- Do not cache failed fetch responses
- Do not change cache names without updating test coupling

## Related lessons
- none in `LESSONS/` yet

## Unknowns
- webp/avif texture fallback strategy (README lists as contributor task)
<!-- agentic:managed:end -->

<!-- human:notes:start -->
PWA is secondary to core simulation — verify SW changes with `swCacheNames.test.ts` and manual offline toggle in InfoModal.
<!-- human:notes:end -->
