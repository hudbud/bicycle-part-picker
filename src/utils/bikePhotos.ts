import type { BikePhoto, Build } from '@/types/build'
import { useGarageStore } from '@/store/garageStore'
import { useBuildStore } from '@/store/buildStore'
import { allPhotoKeys, deletePhotos, getPhoto, putPhoto } from './photoStore'
import { compressImageToBlob } from './imageUtils'
import { canHostPhotos, hostPhoto } from '@/account/photoHosting'

/** Most photos a bike keeps. */
export const MAX_PHOTOS = 24

export const coverPhoto = (build: Build): BikePhoto | undefined => build.photos?.[0]

/** Photos with a public link — the ones a share link can carry. */
export const publicPhotos = (build: Build): BikePhoto[] => (build.photos ?? []).filter((p) => p.url)

export const localOnlyCount = (build: Build): number => (build.photos ?? []).filter((p) => !p.url).length

export { isHostedPhoto } from '@/account/photoHosting'

/**
 * Tidies a pasted photo link: requires https and turns an imgur.com/abc123 page link
 * into the direct i.imgur.com image so it shows inline. Returns undefined if it isn't usable.
 */
export function normalizePhotoUrl(raw: string): string | undefined {
  const v = raw.trim()
  if (!/^https:\/\/\S+$/i.test(v) || v.length > 500) return undefined
  const imgur = v.match(/^https:\/\/(?:www\.|m\.)?imgur\.com\/([A-Za-z0-9]{5,10})\/?(?:[?#].*)?$/)
  return imgur ? `https://i.imgur.com/${imgur[1]}.jpg` : v
}

export const linkPhoto = (url: string, caption?: string): BikePhoto => ({ id: crypto.randomUUID(), url, ...(caption ? { caption } : {}) })

/**
 * Compresses uploaded image files and hosts them (signed in) or keeps them in this browser's
 * photo store (signed out, or the upload failed; they're hosted later). Returns the photos that worked.
 */
export async function uploadPhotos(files: Iterable<File>): Promise<{ photos: BikePhoto[]; failed: number }> {
  const photos: BikePhoto[] = []
  let failed = 0
  for (const file of files) {
    if (!file.type.startsWith('image/')) { failed++; continue }
    try {
      const blob = await compressImageToBlob(file)
      const url = canHostPhotos() ? await hostPhoto(blob).catch(() => undefined) : undefined
      photos.push(url ? { id: crypto.randomUUID(), url } : { id: crypto.randomUUID(), localKey: await putPhoto(blob) })
    } catch {
      failed++
    }
  }
  return { photos, failed }
}

/** Adds photos to a bike, up to MAX_PHOTOS. */
export const withPhotos = (build: Build, added: BikePhoto[]): Build => ({
  ...build,
  photos: [...(build.photos ?? []), ...added].slice(0, MAX_PHOTOS),
})

const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob()
const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

/** Moves a legacy `photo` data URL (and v3-draft `photoUrl`) into `photos`. */
async function migrateBuild(build: Build): Promise<Build | undefined> {
  const legacy = build as Build & { photoUrl?: string }
  if (!legacy.photo && !legacy.photoUrl) return undefined
  const { photo, photoUrl, ...rest } = legacy
  const photos = [...(rest.photos ?? [])]
  if (photo?.startsWith('data:')) {
    try {
      photos.unshift({ id: crypto.randomUUID(), localKey: await putPhoto(await dataUrlToBlob(photo)) })
    } catch {
      return undefined // keep the legacy photo; try again next load
    }
  }
  const url = photoUrl && normalizePhotoUrl(photoUrl)
  if (url && !photos.some((p) => p.url === url)) photos.push(linkPhoto(url))
  return { ...rest, ...(photos.length ? { photos } : {}) }
}

/** One-time move of old single photos into the photo store. Safe to call repeatedly. */
export async function migrateLegacyPhotos(): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  for (const build of useGarageStore.getState().builds) {
    const next = await migrateBuild(build)
    // Write without touching updatedAt — nothing about the bike changed.
    if (next) useGarageStore.setState((s) => ({ builds: s.builds.map((b) => (b.id === build.id ? next : b)) }))
  }
  const current = await migrateBuild(useBuildStore.getState().build)
  if (current) useBuildStore.setState({ build: current })
}

/** Deletes stored photos no bike references any more (removal itself never deletes, so undo stays safe). */
export async function collectPhotoGarbage(): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  const used = new Set<string>()
  for (const b of [...useGarageStore.getState().builds, useBuildStore.getState().build]) {
    for (const p of b.photos ?? []) if (p.localKey) used.add(p.localKey)
  }
  const stale = (await allPhotoKeys()).filter((k) => !used.has(k))
  if (stale.length) await deletePhotos(stale)
}

/** Uploaded photos of these builds as data URLs, keyed by photo-store key — for backups. */
export async function exportLocalPhotos(builds: Build[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const b of builds) {
    for (const p of b.photos ?? []) {
      if (!p.localKey || out[p.localKey]) continue
      const blob = await getPhoto(p.localKey).catch(() => undefined)
      if (blob) out[p.localKey] = await blobToDataUrl(blob)
    }
  }
  return out
}

/** Puts backed-up photos back in the photo store under their original keys. */
export async function importLocalPhotos(photos: Record<string, string> | undefined): Promise<void> {
  for (const [key, dataUrl] of Object.entries(photos ?? {})) {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) continue
    await putPhoto(await dataUrlToBlob(dataUrl), key).catch(() => undefined)
  }
}
