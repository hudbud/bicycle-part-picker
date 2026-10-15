// Shared by the app and the Worker (worker/index.ts): what an account saves.

/** One saved blob per store: current build, garage, parts bin, custom parts, settings. */
export const SYNC_KEYS = ['build', 'garage', 'partsBin', 'customParts', 'settings'] as const
export type SyncKey = (typeof SYNC_KEYS)[number]

export function isSyncKey(k: string): k is SyncKey {
  return (SYNC_KEYS as readonly string[]).includes(k)
}

/** D1 rows top out at 2 MB; keep each blob under that with room to spare. */
export const MAX_BLOB_BYTES = 1_900_000

export interface AccountUser {
  id: string
  name: string
  email: string
  picture?: string
}

/** Largest photo upload the server takes. The app sends ~1600px JPEGs, well under this. */
export const MAX_PHOTO_BYTES = 5_000_000

/** Hosted photos are served from `<origin>/api/photos/<id>`. */
export const HOSTED_PHOTO = /\/api\/photos\/([A-Za-z0-9_-]{22,})(?=$|["?#])/
