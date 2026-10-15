import type { Part } from '@/types/parts'
import type { Build, ComponentSlot, PartStatus } from '@/types/build'
import { getPartById } from './partsDatabase'

/**
 * Retailer offers, price history and ratings are *simulated* — there is no backend
 * or price feed. Everything is derived deterministically from the part id and MSRP so
 * the numbers are stable across reloads and identical for everyone viewing a share link.
 * "Buy" links go to each retailer's real search page for the part.
 * Discontinued (vintage / NOS) parts get used-market listings instead, around the part's
 * `price`, which for those parts is today's typical used value.
 */

export interface Merchant {
  id: string
  name: string
  searchUrl: (query: string) => string
  /** Used / secondhand marketplace rather than a retailer. */
  used?: boolean
}

export const MERCHANTS: Merchant[] = [
  { id: 'competitive', name: 'Competitive Cyclist', searchUrl: (q) => `https://www.competitivecyclist.com/Store/catalog/search.jsp?q=${encodeURIComponent(q)}` },
  { id: 'jenson', name: 'Jenson USA', searchUrl: (q) => `https://www.jensonusa.com/search?q=${encodeURIComponent(q)}` },
  { id: 'rei', name: 'REI', searchUrl: (q) => `https://www.rei.com/search?q=${encodeURIComponent(q)}` },
  { id: 'worldwide', name: 'Worldwide Cyclery', searchUrl: (q) => `https://www.worldwidecyclery.com/search?q=${encodeURIComponent(q)}` },
  { id: 'amazon', name: 'Amazon', searchUrl: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
  { id: 'crc', name: 'Chain Reaction', searchUrl: (q) => `https://www.chainreactioncycles.com/us/en/search?q=${encodeURIComponent(q)}` },
]

/** Where discontinued parts turn up. */
export const USED_MARKETS: Merchant[] = [
  { id: 'ebay', name: 'eBay', used: true, searchUrl: (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}` },
  { id: 'pinkbike', name: 'Pinkbike Buy/Sell', used: true, searchUrl: (q) => `https://www.pinkbike.com/buysell/list/?q=${encodeURIComponent(q)}` },
  { id: 'tpc', name: 'The Pro’s Closet', used: true, searchUrl: (q) => `https://www.theproscloset.com/search?q=${encodeURIComponent(q)}` },
  { id: 'bikeswap', name: 'r/bikeswap', used: true, searchUrl: (q) => `https://www.reddit.com/r/bikeswap/search/?q=${encodeURIComponent(q)}&restrict_sr=1` },
]

export interface Offer {
  merchant: Merchant
  /** Retailer's regular price. */
  base: number
  /** Promotional discount (positive number of dollars off), if any. */
  promo?: number
  shipping: number
  inStock: boolean
  /** base − promo + shipping */
  total: number
  url: string
}

export interface PricePoint {
  /** ISO date (YYYY-MM-DD). */
  date: string
  price: number
}

export interface Rating {
  /** 0–5, one decimal. */
  avg: number
  count: number
}

// ---------- seeded randomness ----------

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rngFor(...parts: string[]) {
  return mulberry32(hashString(parts.join('|')))
}

/** Round to a retail-looking price: $X.99 above $20, nearest $0.49/$0.99 below. */
function retailRound(n: number): number {
  if (n <= 0) return 0
  if (n < 20) return Math.max(0.99, Math.round(n * 2) / 2 - 0.01)
  return Math.max(0.99, Math.round(n) - 0.01)
}

const round2 = (n: number) => Math.round(n * 100) / 100

// ---------- offers ----------

const offerCache = new Map<string, Offer[]>()

/** All simulated retailer offers for a catalog part, cheapest in-stock first. Custom parts have none. */
export function getOffers(part: Part): Offer[] {
  if (part.isCustom || part.price == null) return []
  const cached = offerCache.get(part.id)
  if (cached) return cached

  const rand = rngFor('offers', part.id)
  const msrp = part.price
  const query = `${part.brand} ${part.name}`
  if (part.discontinued) {
    const offers = usedOffers(rand, msrp, query)
    offerCache.set(part.id, offers)
    return offers
  }
  // Every part is stocked somewhere; 2–5 retailers carry it.
  const shuffled = [...MERCHANTS].sort(() => rand() - 0.5)
  const count = 2 + Math.floor(rand() * 4)

  const offers = shuffled.slice(0, count).map((merchant, i): Offer => {
    const discountPct = rand() < 0.55 ? 0 : 0.03 + rand() * 0.15
    const base = retailRound(msrp * (1 - discountPct))
    const promo = rand() < 0.25 ? round2(base * (0.05 + rand() * 0.15)) : undefined
    const shipping = base - (promo ?? 0) >= 50 ? 0 : [4.99, 5.99, 7.99][Math.floor(rand() * 3)]
    const inStock = i === 0 || rand() < 0.8
    return {
      merchant,
      base,
      promo,
      shipping,
      inStock,
      total: round2(base - (promo ?? 0) + shipping),
      url: merchant.searchUrl(query),
    }
  })

  offers.sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.total - b.total)
  offerCache.set(part.id, offers)
  return offers
}

/** Simulated secondhand listings: wide spread around the typical used value, a listing isn't always up. */
function usedOffers(rand: () => number, value: number, query: string): Offer[] {
  const shuffled = [...USED_MARKETS].sort(() => rand() - 0.5)
  const count = 2 + Math.floor(rand() * 3)
  const offers = shuffled.slice(0, count).map((merchant, i): Offer => {
    const base = retailRound(value * (0.75 + rand() * 0.6))
    const shipping = merchant.id === 'bikeswap' ? 0 : [8, 10, 12, 15][Math.floor(rand() * 4)]
    return { merchant, base, shipping, inStock: i === 0 || rand() < 0.6, total: round2(base + shipping), url: merchant.searchUrl(query) }
  })
  offers.sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.total - b.total)
  return offers
}

/** Cheapest in-stock offer, or undefined for custom / unpriced parts. */
export function getBestOffer(part: Part): Offer | undefined {
  return getOffers(part).find((o) => o.inStock)
}

/**
 * The price we show and total for a part: best in-stock retailer price for catalog
 * parts, or the user's own price for custom parts. Snapshots in old saved builds are
 * resolved to the live catalog entry by id.
 */
export function getPartPrice(part: Part | undefined): number | undefined {
  if (!part) return undefined
  if (part.isCustom) return part.price
  const live = getPartById(part.id) ?? part
  return getBestOffer(live)?.total ?? live.price
}

export function slotQuantity(slot: ComponentSlot): number {
  return slot.quantity && slot.quantity > 0 ? slot.quantity : 1
}

export function getSlotPrice(slot: ComponentSlot): number | undefined {
  const unit = getPartPrice(slot.part)
  return unit == null ? undefined : round2(unit * slotQuantity(slot))
}

export interface BuildTotals {
  parts: number
  extras: number
  total: number
  /** Parts selected but with no price — total is then a lower bound. */
  missingPrices: number
}

export function getBuildTotals(build: Build): BuildTotals {
  let parts = 0
  let missingPrices = 0
  for (const slot of build.components) {
    if (!slot.part) continue
    const price = getSlotPrice(slot)
    if (price == null) missingPrices++
    else parts += price
  }
  const extras = (build.additionalItems ?? []).reduce((s, i) => s + (i.price ?? 0), 0)
  return { parts: round2(parts), extras: round2(extras), total: round2(parts + extras), missingPrices }
}

// ---------- tracking totals ----------

/** Statuses meaning "I have this part" (vs. still to buy). */
export const ACQUIRED_STATUSES: ReadonlySet<PartStatus> = new Set(['owned', 'purchased', 'partsbin'])

export const isAcquired = (slot: ComponentSlot) => slot.status != null && ACQUIRED_STATUSES.has(slot.status)

export interface TrackingTotals {
  /** What you actually paid for acquired parts (tracking.pricePaid). */
  spent: number
  /** Acquired parts with no price paid recorded — `spent` is then a lower bound. */
  unrecorded: number
  /** Today's best price for parts still to buy (status 'wanted' or unset). */
  toBuy: number
  /** Parts still to buy with no known price. */
  toBuyUnpriced: number
  /** Extras (additional items) at their listed price. */
  extras: number
  /** Sum of service-log costs. */
  service: number
  acquiredCount: number
  toBuyCount: number
}

/** The tracker's money view of a build: spent so far vs. still to buy. */
export function getTrackingTotals(build: Build): TrackingTotals {
  const t: TrackingTotals = { spent: 0, unrecorded: 0, toBuy: 0, toBuyUnpriced: 0, extras: 0, service: 0, acquiredCount: 0, toBuyCount: 0 }
  for (const slot of build.components) {
    if (!slot.part) continue
    if (isAcquired(slot)) {
      t.acquiredCount++
      if (slot.tracking?.pricePaid != null) t.spent += slot.tracking.pricePaid
      else t.unrecorded++
    } else {
      t.toBuyCount++
      const price = getSlotPrice(slot)
      if (price == null) t.toBuyUnpriced++
      else t.toBuy += price
    }
  }
  t.extras = (build.additionalItems ?? []).reduce((s, i) => s + (i.price ?? 0), 0)
  t.service = (build.serviceLog ?? []).reduce((s, e) => s + (e.cost ?? 0), 0)
  t.spent = round2(t.spent)
  t.toBuy = round2(t.toBuy)
  t.extras = round2(t.extras)
  t.service = round2(t.service)
  return t
}

// ---------- price history ----------

const HISTORY_DAYS = 180
const historyCache = new Map<string, PricePoint[]>()

function isoDay(offsetDays: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - offsetDays)
  return d.toISOString().slice(0, 10)
}

/**
 * Daily lowest-price history for the last 180 days, ending at today's best price.
 * Simulated: a random walk between today's best and the regular price, with a few sale dips.
 */
export function getPriceHistory(part: Part): PricePoint[] {
  const best = getBestOffer(part)
  if (!best || part.price == null) return []
  const cached = historyCache.get(part.id)
  if (cached) return cached

  const rand = rngFor('history', part.id)
  // Walk a multiplier of today's best total so history and today share one basis (incl. shipping).
  const sales: Array<[number, number, number]> = [] // [startDay, length, depth]
  const saleCount = Math.floor(rand() * 4)
  for (let i = 0; i < saleCount; i++) {
    sales.push([Math.floor(rand() * HISTORY_DAYS), 4 + Math.floor(rand() * 12), 0.08 + rand() * 0.12])
  }

  // Before today's deal, prices hovered between today's best and the regular (MSRP / pre-promo) price.
  const regular = Math.max(part.price + best.shipping, best.base + best.shipping) / best.total
  const walk = () => Math.min(regular, 0.98 + rand() * (regular - 0.96))
  const points: PricePoint[] = []
  let level = walk()
  for (let day = HISTORY_DAYS - 1; day >= 0; day--) {
    // Prices change a few times a month, not daily.
    if (rand() < 0.08) level = walk()
    const sale = sales.find(([start, len]) => day <= start && day > start - len)
    let factor = sale ? level * (1 - sale[2]) : level
    // Converge on today's real best price over the last two weeks.
    if (day < 14) factor = 1 + (factor - 1) * (day / 14)
    points.push({ date: isoDay(day), price: day === 0 ? best.total : round2(retailRound(best.total * factor)) })
  }
  historyCache.set(part.id, points)
  return points
}

export interface PriceChange {
  current: number
  /** Highest price in the comparison window. */
  previous: number
  /** previous − current, positive when cheaper now. */
  drop: number
  dropPct: number
}

/** Compare today's best price to the max over the last `days` days. */
export function getPriceChange(part: Part, days = 30): PriceChange | undefined {
  const history = getPriceHistory(part)
  if (history.length === 0) return undefined
  const window = history.slice(-days - 1, -1)
  const current = history[history.length - 1].price
  const previous = Math.max(...window.map((p) => p.price))
  const drop = round2(previous - current)
  return { current, previous, drop, dropPct: previous > 0 ? drop / previous : 0 }
}

// ---------- ratings ----------

/** Simulated community rating. Pricier, newer parts get a few more ratings. */
export function getRating(part: Part): Rating | undefined {
  if (part.isCustom) return undefined
  const rand = rngFor('rating', part.id)
  if (rand() < 0.08) return { avg: 0, count: 0 }
  const avg = Math.round((3.6 + rand() * 1.4) * 10) / 10
  const popularity = part.price != null && part.price < 150 ? 2.2 : 1
  const count = Math.max(1, Math.floor(rand() * rand() * 420 * popularity))
  return { avg: Math.min(5, avg), count }
}
