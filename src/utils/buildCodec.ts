import type { Build, BuildStage, ComponentSlot, PartCondition, PartStatus, PartTracking, AdditionalItem } from '@/types/build'
import type { Part, PartCategory } from '@/types/parts'
import { getPartById } from '@/data/partsDatabase'
import { ALL_CATEGORIES, WHEEL_SUB_CATEGORIES } from '@/data/categoryConfig'

/** Most photo links a bike link carries. */
export const MAX_LINK_PHOTOS = 12

const PART_STATUSES: PartStatus[] = ['owned', 'purchased', 'partsbin', 'wanted']

function isComponentSlot(x: unknown): x is ComponentSlot {
  if (typeof x !== 'object' || x === null) return false
  const slot = x as Record<string, unknown>
  if (typeof slot.category !== 'string') return false
  if (slot.status !== undefined && !PART_STATUSES.includes(slot.status as PartStatus)) return false
  if (slot.quantity !== undefined && (typeof slot.quantity !== 'number' || !(slot.quantity > 0))) return false
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
  if (!Array.isArray(b.components)) return false
  return b.components.every(isComponentSlot)
}

// ---------------------------------------------------------------------------
// Share-link payload, v2.
//
//   { v: 2, n: name, d?: description, o?: ownerName, w?: 1 (wheels split),
//     ts?: createdAt,
//     c: [[category, partId, status?, qty?, snapshot?], ...]   catalog parts by id
//     x: [[category, part, status?, qty?], ...]                custom parts in full
//     a: [[name, price?, notes?, url?], ...] }                 extras
//
// JSON → UTF-8 → base64url (no padding). Status is a one-letter code, 0 = none.
// `snapshot` ({n, b, p}) is only written for ids the catalog doesn't know at encode
// time, so the link still shows something sensible. Ids that vanish from the catalog
// *after* a link was made decode to a placeholder named from the id.
// v1 links (base64 of encodeURIComponent(full Build JSON)) still decode.
// Photos are never included — a base64 JPEG makes URLs unusably long.
// ---------------------------------------------------------------------------

const STATUS_CODE: Record<PartStatus, string> = { owned: 'o', purchased: 'p', partsbin: 'b', wanted: 'w' }
const CODE_STATUS: Record<string, PartStatus> = { o: 'owned', p: 'purchased', b: 'partsbin', w: 'wanted' }

type Snapshot = { n: string; b: string; p?: number }
/** Opt-in per-part tracking on public bike links (v3): notes, price paid, condition code. */
type SharedTracking = { n?: string; p?: number; c?: string }
type CatalogEntry = [PartCategory, string, (string | 0)?, (number | 0)?, (Snapshot | 0 | null)?, SharedTracking?]
type CustomEntry = [PartCategory, Part, (string | 0)?, (number | 0)?, SharedTracking?]
type ExtraEntry = [string, (number | null)?, (string | null)?, (string | null)?]

interface PayloadV2 {
  v: 2 | 3
  /** v3: public photo links (cover first; `[url, caption]` when captioned), odometer km, stage. */
  u?: string | (string | [string, string])[]
  km?: number
  s?: BuildStage
  n: string
  /** Bike type, written by older versions; ignored. */
  t?: string
  d?: string
  o?: string
  w?: 1
  ts?: string
  c: CatalogEntry[]
  x?: CustomEntry[]
  a?: ExtraEntry[]
}

/** Drop trailing undefined/0 entries so tuples stay short. */
function trimTuple<T extends unknown[]>(t: T): T {
  let end = t.length
  while (end > 2 && (t[end - 1] === undefined || t[end - 1] === 0 || t[end - 1] === null)) end--
  return t.slice(0, end) as T
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

function stripCustomPart(part: Part): Part {
  // Everything except empty containers; custom parts have no catalog to fall back on.
  const { specs, tags, ...rest } = part
  // specs/tags are re-filled on decode ({} and ['Custom']), so omit them when trivial.
  const out = { ...rest } as Partial<Part>
  if (specs && Object.keys(specs).length) out.specs = specs
  if (tags && tags.length && !(tags.length === 1 && tags[0] === 'Custom')) out.tags = tags
  return out as Part
}

/**
 * What a public bike link carries beyond the parts list. Serials, sources, dates and the
 * service log are never shared.
 */
export interface ShareOptions {
  /** Per-part notes ("swapped from drops — best decision"). */
  notes: boolean
  pricesPaid: boolean
  condition: boolean
  odometer: boolean
}

export const DEFAULT_SHARE_OPTIONS: ShareOptions = { notes: true, pricesPaid: false, condition: false, odometer: false }

const CONDITION_CODE: Record<PartCondition, string> = { new: 'n', nos: 's', 'used-good': 'g', 'used-fair': 'f', 'needs-work': 'w' }
const CODE_CONDITION: Record<string, PartCondition> = { n: 'new', s: 'nos', g: 'used-good', f: 'used-fair', w: 'needs-work' }
const STAGES: BuildStage[] = ['planning', 'building', 'riding', 'retired']

function sharedTracking(t: PartTracking | undefined, opts: ShareOptions | undefined): SharedTracking | undefined {
  if (!t || !opts) return undefined
  const k: SharedTracking = {}
  if (opts.notes && t.notes?.trim()) k.n = t.notes.trim()
  if (opts.pricesPaid && t.pricePaid != null) k.p = t.pricePaid
  if (opts.condition && t.condition) k.c = CONDITION_CODE[t.condition]
  return Object.keys(k).length ? k : undefined
}

function buildPayload(build: Build, opts?: ShareOptions): PayloadV2 {
  const c: CatalogEntry[] = []
  const x: CustomEntry[] = []
  for (const slot of build.components) {
    if (!slot.part) continue
    const status = slot.status ? STATUS_CODE[slot.status] : 0
    const qty = slot.quantity && slot.quantity !== 1 ? slot.quantity : 0
    const k = sharedTracking(slot.tracking, opts)
    if (slot.part.isCustom) {
      x.push(trimTuple<CustomEntry>([slot.category, stripCustomPart(slot.part), status, qty, k]))
    } else if (getPartById(slot.part.id)) {
      c.push(trimTuple<CatalogEntry>([slot.category, slot.part.id, status, qty, 0, k]))
    } else {
      const snap: Snapshot = { n: slot.part.name, b: slot.part.brand }
      if (slot.part.price != null) snap.p = slot.part.price
      c.push(trimTuple<CatalogEntry>([slot.category, slot.part.id, status, qty, snap, k]))
    }
  }
  const payload: PayloadV2 = { v: opts ? 3 : 2, n: build.name, c }
  if (opts) {
    const photos = (build.photos ?? []).filter((ph) => ph.url?.startsWith('https://')).slice(0, MAX_LINK_PHOTOS)
    if (photos.length) payload.u = photos.map((ph): string | [string, string] => (ph.caption ? [ph.url!, ph.caption] : ph.url!))
    if (build.stage) payload.s = build.stage
    if (opts.odometer && build.odometerKm) payload.km = Math.round(build.odometerKm)
  }
  if (build.description) payload.d = build.description
  if (build.ownerName) payload.o = build.ownerName
  if (build.wheelsExpanded) payload.w = 1
  // Public bike links carry no dates.
  if (build.createdAt && !opts) payload.ts = build.createdAt
  if (x.length) payload.x = x
  const extras = build.additionalItems ?? []
  if (extras.length) {
    payload.a = extras.map((i) => trimTuple<ExtraEntry>([i.name, i.price ?? null, i.notes ?? null, i.url ?? null]))
  }
  return payload
}

export function encodeBuildForShare(build: Build): string {
  return toBase64Url(JSON.stringify(buildPayload(build)))
}

/** Full share URL for a build (`/build/shared?b=…`). */
export function buildShareUrl(build: Build, origin: string = window.location.origin): string {
  return `${origin}/build/shared?b=${encodeBuildForShare(build)}`
}

// ---------------------------------------------------------------------------
// Public bike links: `/bike#<payload>` — the v3 payload (parts + opt-in notes/paid/
// condition, photo URL, stage, odometer), deflate-raw compressed when the browser has
// CompressionStream ('z' prefix), else plain base64url JSON ('j' prefix). It lives in the
// URL fragment, so it never reaches a server log. Roughly 0.9–1.5k chars for a full build.
// ---------------------------------------------------------------------------

/** Origin for links meant to be pasted elsewhere. Set VITE_PUBLIC_ORIGIN to the deployed site. */
export function publicOrigin(): string {
  const env = import.meta.env.VITE_PUBLIC_ORIGIN as string | undefined
  return (env || window.location.origin).replace(/\/+$/, '')
}

async function pipeBytes(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream))
  return new Uint8Array(await out.arrayBuffer())
}

const bytesToB64Url = (bytes: Uint8Array) => {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const b64UrlToBytes = (encoded: string) => {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
  return Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), (ch) => ch.charCodeAt(0))
}

export async function encodeBikeLink(build: Build, opts: ShareOptions = DEFAULT_SHARE_OPTIONS): Promise<string> {
  const json = JSON.stringify(buildPayload(build, opts))
  if (typeof CompressionStream !== 'undefined') {
    try {
      return 'z' + bytesToB64Url(await pipeBytes(new TextEncoder().encode(json), new CompressionStream('deflate-raw')))
    } catch {
      // fall through to uncompressed
    }
  }
  return 'j' + toBase64Url(json)
}

/** Public, read-only bike page URL: `${publicOrigin()}/bike#…`. */
export async function bikeShareUrl(build: Build, opts: ShareOptions = DEFAULT_SHARE_OPTIONS, origin = publicOrigin()): Promise<string> {
  return `${origin}/bike#${await encodeBikeLink(build, opts)}`
}

/** Decodes a `/bike#…` fragment (with or without the leading '#'). */
export async function decodeBikeLink(fragment: string): Promise<Build | null> {
  const code = fragment.replace(/^#/, '').trim()
  if (code.length < 2) return null
  try {
    let json: string
    if (code[0] === 'z') {
      if (typeof DecompressionStream === 'undefined') return null
      json = new TextDecoder('utf-8', { fatal: true }).decode(await pipeBytes(b64UrlToBytes(code.slice(1)), new DecompressionStream('deflate-raw')))
    } else if (code[0] === 'j') {
      json = fromBase64Url(code.slice(1))
    } else {
      return decodeSharedBuild(code)
    }
    const parsed: unknown = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null) return null
    const v = (parsed as { v?: unknown }).v
    return v === 2 || v === 3 ? decodeV2(parsed as PayloadV2) : null
  } catch {
    return null
  }
}

/** Builder row order, with the split-wheel rows where "Wheelset" sits. */
const SLOT_ORDER: PartCategory[] = ALL_CATEGORIES.flatMap((c) =>
  c.id === 'wheels' ? [c.id, ...WHEEL_SUB_CATEGORIES.map((w) => w.id)] : [c.id],
)
const slotRank = (c: PartCategory) => {
  const i = SLOT_ORDER.indexOf(c)
  return i === -1 ? SLOT_ORDER.length : i
}

function titleFromId(id: string): string {
  return id.split(/[-_]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function decodeV2(p: PayloadV2): Build | null {
  if (!Array.isArray(p.c)) return null
  const components: ComponentSlot[] = []
  const pushSlot = (category: PartCategory, part: Part, status?: string | 0, qty?: number | 0, k?: SharedTracking) => {
    const slot: ComponentSlot = { category, part }
    if (status && CODE_STATUS[status]) slot.status = CODE_STATUS[status]
    if (qty && qty > 0) slot.quantity = qty
    if (k && typeof k === 'object') {
      const t: PartTracking = {}
      if (typeof k.n === 'string' && k.n) t.notes = k.n
      if (typeof k.p === 'number' && k.p >= 0) t.pricePaid = k.p
      if (typeof k.c === 'string' && CODE_CONDITION[k.c]) t.condition = CODE_CONDITION[k.c]
      if (Object.keys(t).length) slot.tracking = t
    }
    components.push(slot)
  }
  for (const entry of p.c) {
    if (!Array.isArray(entry) || typeof entry[0] !== 'string' || typeof entry[1] !== 'string') continue
    const [category, id, status, qty, rawSnap, k] = entry
    const snap = rawSnap || undefined
    const live = getPartById(id)
    const part: Part = live ?? {
      id,
      name: snap?.n ?? titleFromId(id),
      brand: snap?.b ?? '',
      category,
      price: typeof snap?.p === 'number' ? snap.p : undefined,
      specs: {},
      tags: [],
    }
    pushSlot(category, part, status, qty, k)
  }
  for (const entry of p.x ?? []) {
    if (!Array.isArray(entry) || typeof entry[0] !== 'string' || typeof entry[1] !== 'object' || !entry[1]) continue
    const [category, raw, status, qty, k] = entry
    const part: Part = { ...raw, category: raw.category ?? category, specs: raw.specs ?? {}, tags: raw.tags ?? ['Custom'], isCustom: true }
    pushSlot(category, part, status, qty, k)
  }
  components.sort((a, b) => slotRank(a.category) - slotRank(b.category))
  const additionalItems: AdditionalItem[] = (p.a ?? [])
    .filter((e): e is ExtraEntry => Array.isArray(e) && typeof e[0] === 'string')
    .map(([name, price, notes, url], i) => {
      const item: AdditionalItem = { id: `extra-${i + 1}`, name }
      if (typeof price === 'number') item.price = price
      if (typeof notes === 'string') item.notes = notes
      if (typeof url === 'string') item.url = url
      return item
    })

  const build: Build = { name: p.n, components }
  if (p.d) build.description = p.d
  if (p.o) build.ownerName = p.o
  if (p.w) build.wheelsExpanded = true
  if (p.ts) build.createdAt = p.ts
  if (additionalItems.length) build.additionalItems = additionalItems
  const photos = (Array.isArray(p.u) ? p.u : p.u ? [p.u] : [])
    .map((e) => (Array.isArray(e) ? { url: e[0], caption: e[1] } : { url: e }))
    .filter((ph) => typeof ph.url === 'string' && ph.url.length <= 500 && /^https:\/\/\S+$/.test(ph.url))
    .slice(0, MAX_LINK_PHOTOS)
    .map((ph, i) => ({ id: `p${i}`, url: ph.url, ...(typeof ph.caption === 'string' && ph.caption ? { caption: ph.caption.slice(0, 140) } : {}) }))
  if (photos.length) build.photos = photos
  if (typeof p.km === 'number' && p.km > 0) build.odometerKm = p.km
  if (p.s && STAGES.includes(p.s)) build.stage = p.s
  return isBuild(build) ? build : null
}

export function decodeSharedBuild(encoded: string): Build | null {
  if (!encoded) return null
  // v2: base64url JSON with a version tag.
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded))
    if (typeof parsed === 'object' && parsed !== null && [2, 3].includes((parsed as { v?: unknown }).v as number)) {
      return decodeV2(parsed as PayloadV2)
    }
  } catch {
    // not v2 — fall through
  }
  // v1: btoa(encodeURIComponent(JSON)). Unescaped '+' in old links arrives as a space.
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(atob(encoded.replace(/ /g, '+'))))
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
