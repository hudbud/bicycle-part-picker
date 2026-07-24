import type { Build, BikeType, ComponentSlot, PartStatus } from '@/types/build'

const BIKE_TYPES: BikeType[] = ['road', 'mtb', 'gravel', 'track', 'bmx', 'other']
const PART_STATUSES: PartStatus[] = ['owned', 'purchased', 'partsbin', 'wanted']

function isComponentSlot(x: unknown): x is ComponentSlot {
  if (typeof x !== 'object' || x === null) return false
  const slot = x as Record<string, unknown>
  if (typeof slot.category !== 'string') return false
  if (slot.status !== undefined && !PART_STATUSES.includes(slot.status as PartStatus)) return false
  if (slot.part !== undefined) {
    if (typeof slot.part !== 'object' || slot.part === null) return false
    const part = slot.part as Record<string, unknown>
    if (typeof part.id !== 'string' || typeof part.name !== 'string' || typeof part.brand !== 'string') return false
  }
  return true
}

export function isBuild(x: unknown): x is Build {
  if (typeof x !== 'object' || x === null) return false
  const b = x as Record<string, unknown>
  if (typeof b.name !== 'string') return false
  if (!BIKE_TYPES.includes(b.bikeType as BikeType)) return false
  if (!Array.isArray(b.components)) return false
  return b.components.every(isComponentSlot)
}

// Shared links exclude the photo — a base64 JPEG makes URLs unusably long.
export function encodeBuildForShare(build: Build): string {
  const { photo: _photo, ...shareable } = build
  return btoa(encodeURIComponent(JSON.stringify(shareable)))
}

export function decodeSharedBuild(encoded: string): Build | null {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(atob(encoded)))
    return isBuild(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Parses a build previously downloaded via the JSON export.
export function parseBuildFile(text: string): Build | null {
  try {
    const parsed: unknown = JSON.parse(text)
    return isBuild(parsed) ? parsed : null
  } catch {
    return null
  }
}
