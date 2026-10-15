// Signed-in people's photos are hosted (R2, via /api/photos) so they're on every device and in
// share links. Signed out, uploads stay in this browser's photo store; once signed in, those
// are uploaded and their bikes switched over to the hosted copy.

import type { BikePhoto, Build } from '@/types/build'
import { useGarageStore } from '@/store/garageStore'
import { useBuildStore } from '@/store/buildStore'
import { getPhoto } from '@/utils/photoStore'
import { useAccountStore } from './accountStore'
import { HOSTED_PHOTO } from './syncKeys'

export const isHostedPhoto = (p: BikePhoto) => !!p.url && HOSTED_PHOTO.test(p.url)

export const canHostPhotos = () => !!useAccountStore.getState().user

/** Uploads one image; resolves to its public URL. */
export async function hostPhoto(blob: Blob): Promise<string> {
  const res = await fetch('/api/photos', { method: 'POST', body: blob, credentials: 'same-origin', headers: { 'Content-Type': blob.type || 'image/jpeg' } })
  const body = await res.json().catch(() => undefined)
  if (!res.ok || typeof body?.url !== 'string') throw new Error(body?.error ?? `HTTP ${res.status}`)
  return body.url
}

const localKeys = (builds: Build[]) => {
  const keys = new Set<string>()
  for (const b of builds) for (const p of b.photos ?? []) if (p.localKey && !p.url) keys.add(p.localKey)
  return keys
}

const swap = (build: Build, hosted: Map<string, string>): Build => {
  if (!build.photos?.some((p) => p.localKey && hosted.has(p.localKey))) return build
  return {
    ...build,
    photos: build.photos.map((p) => {
      const url = p.localKey && hosted.get(p.localKey)
      if (!url) return p
      const { localKey: _k, ...rest } = p
      return { ...rest, url }
    }),
  }
}

let running: Promise<void> | undefined
/** Photos that won't upload (gone from this device, or refused); not retried this session. */
const skip = new Set<string>()

/** Uploads photos that are only on this device. Safe to call often; does nothing signed out. */
export function hostLocalPhotos(): Promise<void> {
  running ??= (async () => {
    try {
      while (canHostPhotos()) {
        const all = [...useGarageStore.getState().builds, useBuildStore.getState().build]
        const key = [...localKeys(all)].find((k) => !skip.has(k))
        if (!key) return
        const blob = await getPhoto(key).catch(() => undefined)
        if (!blob) { skip.add(key); continue }
        let url: string
        try {
          url = await hostPhoto(blob)
        } catch (err) {
          // Offline: try again after the next save. Refused (too big, storage full): leave it on the device.
          if (!(err instanceof TypeError)) skip.add(key)
          return
        }
        const hosted = new Map([[key, url]])
        // Applied to the stores as they are now, not as they were before the upload. updatedAt
        // stays put: the bike didn't change, only where its photo lives.
        useGarageStore.setState((s) => ({ builds: s.builds.map((b) => swap(b, hosted)) }))
        useBuildStore.setState((s) => ({ build: swap(s.build, hosted) }))
      }
    } finally {
      running = undefined
    }
  })()
  return running
}
