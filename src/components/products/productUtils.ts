import type { Part, PartCategory } from '@/types/parts'
import type { Build } from '@/types/build'
import { getSpecFields, getSpecValue, type SpecField } from '@/data/specSchema'
import { getPartPrice, getRating } from '@/data/pricing'
import { getCategoryMeta } from '@/data/categoryConfig'

export type SpecRaw = ReturnType<typeof getSpecValue>

export const partFullName = (p: Part) => `${p.brand} ${p.name}`

/** "Choose A Frame" / "Choose Tires" — skip the article for plural-ish labels. */
export function chooseTitle(category: PartCategory): string {
  const meta = getCategoryMeta(category)
  const label = meta?.label ?? category
  const pluralish = meta?.plural === label || /s$/i.test(label.split(' / ')[0])
  return pluralish ? `Choose ${label}` : `Choose A ${label}`
}

/** True when the build has a part in any slot other than `slot`. */
export function buildHasOtherParts(build: Build, slot: PartCategory): boolean {
  return build.components.some((s) => s.part && s.category !== slot)
}

/** Distinct facet values for a field (arrays exploded), as strings. */
export function rawFacetValues(part: Part, field: SpecField): string[] {
  const v = getSpecValue(part, field.key)
  if (v == null) return []
  if (Array.isArray(v)) return v.map(String)
  return [String(v)]
}

export function numericValue(part: Part, field: SpecField): number | undefined {
  const v = getSpecValue(part, field.key)
  return typeof v === 'number' ? v : undefined
}

/** Parse a facet key back into a value formatFacetValue understands. */
export function parseFacet(raw: string): string | number | boolean {
  if (raw === 'true') return true
  if (raw === 'false') return false
  const n = Number(raw)
  return raw.trim() !== '' && Number.isFinite(n) ? n : raw
}

export interface FacetOption {
  value: string
  count: number
}

export function facetOptions(parts: Part[], field: SpecField): FacetOption[] {
  const counts = new Map<string, number>()
  for (const p of parts) {
    for (const v of new Set(rawFacetValues(p, field))) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      const na = Number(a.value)
      const nb = Number(b.value)
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
      return a.value.localeCompare(b.value)
    })
}

export function numericExtent(parts: Part[], get: (p: Part) => number | undefined): [number, number] | undefined {
  let lo = Infinity
  let hi = -Infinity
  for (const p of parts) {
    const v = get(p)
    if (v == null) continue
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  }
  return lo === Infinity ? undefined : [lo, hi]
}

// ---------- filter state ----------

export interface RangeValue {
  min: string
  max: string
}

/** Era facet: current production vs. discontinued / vintage (`part.discontinued`). '' = both. */
export type EraFilter = '' | 'current' | 'discontinued'

export const ERA_OPTIONS: { value: EraFilter; label: string }[] = [
  { value: '', label: 'Any era' },
  { value: 'current', label: 'Current production' },
  { value: 'discontinued', label: 'Discontinued & vintage' },
]

export function matchesEra(p: Part, era: EraFilter): boolean {
  if (!era) return true
  return era === 'discontinued' ? !!p.discontinued : !p.discontinued
}

export interface BrowseFilters {
  q: string
  era: EraFilter
  /** undefined = use the default (on when the build has other parts). */
  compat?: boolean
  price: RangeValue
  brands: string[]
  enums: Record<string, string[]>
  ranges: Record<string, RangeValue>
  minRating: number
  sort: string
  dir: 'asc' | 'desc'
}

export const EMPTY_RANGE: RangeValue = { min: '', max: '' }

export function emptyFilters(q = ''): BrowseFilters {
  return { q, era: '', price: EMPTY_RANGE, brands: [], enums: {}, ranges: {}, minRating: 0, sort: 'price', dir: 'asc' }
}

/** Keep `slot` and other unrelated params; overwrite everything filter-related. */
const FILTER_PARAM = /^(q|era|compat|pmin|pmax|brand|rating|sort|dir|f_.+|min_.+|max_.+)$/

export function filtersFromParams(params: URLSearchParams): BrowseFilters {
  const f = emptyFilters(params.get('q') ?? '')
  const era = params.get('era')
  if (era === 'current' || era === 'discontinued') f.era = era
  const compat = params.get('compat')
  if (compat === '1') f.compat = true
  if (compat === '0') f.compat = false
  f.price = { min: params.get('pmin') ?? '', max: params.get('pmax') ?? '' }
  f.brands = params.getAll('brand')
  f.minRating = Number(params.get('rating')) || 0
  f.sort = params.get('sort') ?? 'price'
  f.dir = params.get('dir') === 'desc' ? 'desc' : 'asc'
  for (const [k, v] of params.entries()) {
    if (k.startsWith('f_')) {
      const key = k.slice(2)
      f.enums[key] = [...(f.enums[key] ?? []), v]
    } else if (k.startsWith('min_') || k.startsWith('max_')) {
      const key = k.slice(4)
      const r = f.ranges[key] ?? { ...EMPTY_RANGE }
      f.ranges[key] = k.startsWith('min_') ? { ...r, min: v } : { ...r, max: v }
    }
  }
  return f
}

export function filtersToParams(f: BrowseFilters, base: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams()
  for (const [k, v] of base.entries()) if (!FILTER_PARAM.test(k)) p.append(k, v)
  if (f.q) p.set('q', f.q)
  if (f.era) p.set('era', f.era)
  if (f.compat !== undefined) p.set('compat', f.compat ? '1' : '0')
  if (f.price.min) p.set('pmin', f.price.min)
  if (f.price.max) p.set('pmax', f.price.max)
  f.brands.forEach((b) => p.append('brand', b))
  for (const [key, values] of Object.entries(f.enums)) values.forEach((v) => p.append(`f_${key}`, v))
  for (const [key, r] of Object.entries(f.ranges)) {
    if (r.min) p.set(`min_${key}`, r.min)
    if (r.max) p.set(`max_${key}`, r.max)
  }
  if (f.minRating) p.set('rating', String(f.minRating))
  if (f.sort !== 'price' || f.dir !== 'asc') {
    p.set('sort', f.sort)
    p.set('dir', f.dir)
  }
  return p
}

export function activeFilterCount(f: BrowseFilters): number {
  return (
    (f.era ? 1 : 0) +
    (f.price.min || f.price.max ? 1 : 0) +
    f.brands.length +
    Object.values(f.enums).reduce((n, v) => n + v.length, 0) +
    Object.values(f.ranges).filter((r) => r.min || r.max).length +
    (f.minRating ? 1 : 0)
  )
}

const num = (s: string) => {
  if (s.trim() === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

function inRange(v: number | undefined, r: RangeValue | undefined): boolean {
  if (!r) return true
  const lo = num(r.min)
  const hi = num(r.max)
  if (lo == null && hi == null) return true
  if (v == null) return false
  return (lo == null || v >= lo) && (hi == null || v <= hi)
}

export function matchesQuery(p: Part, q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return true
  const hay = `${p.brand} ${p.name} ${p.tags.join(' ')}`.toLowerCase()
  return s.split(/\s+/).every((w) => hay.includes(w))
}

/** Everything except the compatibility filter. */
export function applyFilters(parts: Part[], f: BrowseFilters, category: PartCategory): Part[] {
  const fields = getSpecFields(category)
  return parts.filter((p) => {
    if (!matchesQuery(p, f.q)) return false
    if (!matchesEra(p, f.era)) return false
    if (!inRange(getPartPrice(p), f.price)) return false
    if (f.brands.length && !f.brands.includes(p.brand)) return false
    if (f.minRating) {
      const r = getRating(p)
      if (!r || r.count === 0 || r.avg < f.minRating) return false
    }
    for (const field of fields) {
      if (field.filter === 'range') {
        if (!inRange(numericValue(p, field), f.ranges[field.key])) return false
      } else if (field.filter === 'enum' || field.filter === 'bool') {
        const sel = f.enums[field.key]
        if (sel?.length && !rawFacetValues(p, field).some((v) => sel.includes(v))) return false
      }
    }
    return true
  })
}

// ---------- sorting ----------

function sortValue(p: Part, key: string, category: PartCategory): number | string | undefined {
  if (key === 'name') return partFullName(p).toLowerCase()
  if (key === 'price') return getPartPrice(p)
  if (key === 'rating') {
    const r = getRating(p)
    return r && r.count ? r.avg * 10000 + r.count : undefined
  }
  const field = getSpecFields(category).find((f) => f.key === key)
  if (!field) return undefined
  const v = getSpecValue(p, field.key)
  if (v == null) return undefined
  if (Array.isArray(v)) return v.length ? (typeof v[0] === 'number' ? (v[0] as number) : String(v[0])) : undefined
  if (typeof v === 'boolean') return v ? 1 : 0
  return typeof v === 'number' ? v : String(v).toLowerCase()
}

/** Sort with missing values always last regardless of direction. */
export function sortParts(parts: Part[], key: string, dir: 'asc' | 'desc', category: PartCategory): Part[] {
  const sign = dir === 'asc' ? 1 : -1
  return parts
    .map((p) => ({ p, v: sortValue(p, key, category) }))
    .sort((a, b) => {
      if (a.v == null && b.v == null) return 0
      if (a.v == null) return 1
      if (b.v == null) return -1
      if (typeof a.v === 'number' && typeof b.v === 'number') return (a.v - b.v) * sign
      return String(a.v).localeCompare(String(b.v)) * sign
    })
    .map(({ p }) => p)
}

/** MSRP worth striking through: retail price is at least 3% (and $1) lower. */
export function strikeMsrp(part: Part): number | undefined {
  const price = getPartPrice(part)
  // Discontinued parts' `price` is a used-market value, not an MSRP — nothing to strike.
  if (part.isCustom || part.discontinued || part.price == null || price == null) return undefined
  const diff = part.price - price
  return diff >= 1 && diff / part.price >= 0.03 ? part.price : undefined
}

/** "seatpostMm" → "Seatpost Mm", for legacy free-form spec keys. */
export function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
}
