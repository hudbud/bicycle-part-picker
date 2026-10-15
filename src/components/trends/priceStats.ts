import type { Part, PartCategory } from '@/types/parts'
import { ALL_PARTS, getPartsByCategory } from '@/data/partsDatabase'
import { getPriceChange, getPriceHistory } from '@/data/pricing'

/**
 * Aggregations over the (simulated) per-part price histories, for the home page's
 * "Price Drops" list and the Price Trends page.
 */

export interface PriceMove {
  part: Part
  /** Comparison price: 30-day high for drops, 30-day low for increases. */
  was: number
  now: number
  /** Signed fractional change, (now − was) / was. Negative = cheaper. */
  pct: number
}

/** Current-production parts only: discontinued parts carry used-market estimates, not retail prices. */
export const isRetail = (p: Part) => !p.discontinued

/** A category's retail (current-production) parts. */
export function retailParts(category: PartCategory): Part[] {
  return getPartsByCategory(category).filter(isRetail)
}

let dropsCache: PriceMove[] | null = null
let risesCache: PriceMove[] | null = null

/** Every catalog part whose best price is below its 30-day high, biggest % drop first. */
export function getPriceDrops(days = 30): PriceMove[] {
  if (dropsCache && days === 30) return dropsCache
  const out: PriceMove[] = []
  for (const part of ALL_PARTS) {
    if (!isRetail(part)) continue
    const c = getPriceChange(part, days)
    if (!c || c.drop <= 0 || c.previous <= 0) continue
    out.push({ part, was: c.previous, now: c.current, pct: -c.dropPct })
  }
  out.sort((a, b) => a.pct - b.pct)
  if (days === 30) dropsCache = out
  return out
}

/** Every catalog part whose best price is above its 30-day low, biggest % rise first. */
export function getPriceIncreases(days = 30): PriceMove[] {
  if (risesCache && days === 30) return risesCache
  const out: PriceMove[] = []
  for (const part of ALL_PARTS) {
    if (!isRetail(part)) continue
    const h = getPriceHistory(part)
    if (h.length < 2) continue
    const window = h.slice(-days - 1, -1)
    const now = h[h.length - 1].price
    const low = Math.min(...window.map((p) => p.price))
    if (!(low > 0) || now <= low) continue
    out.push({ part, was: low, now, pct: (now - low) / low })
  }
  out.sort((a, b) => b.pct - a.pct)
  if (days === 30) risesCache = out
  return out
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export interface TrendSeries {
  dates: string[]
  median: number[]
  p25: number[]
  p75: number[]
  /** Parts that contributed a history. */
  partCount: number
}

/** Daily median and 25th/75th percentile of best price across `parts`, last `days` days. */
export function aggregateHistory(parts: Part[], days = 180): TrendSeries {
  const histories = parts.map(getPriceHistory).filter((h) => h.length > 0)
  if (histories.length === 0) return { dates: [], median: [], p25: [], p75: [], partCount: 0 }
  const len = Math.min(days, ...histories.map((h) => h.length))
  // Align on the most recent `len` days (all histories end today).
  const dates = histories[0].slice(-len).map((p) => p.date)
  const median: number[] = []
  const p25: number[] = []
  const p75: number[] = []
  for (let i = 0; i < len; i++) {
    const day = histories.map((h) => h[h.length - len + i].price).sort((a, b) => a - b)
    median.push(quantile(day, 0.5))
    p25.push(quantile(day, 0.25))
    p75.push(quantile(day, 0.75))
  }
  return { dates, median, p25, p75, partCount: histories.length }
}

export function categoryTrend(category: PartCategory, days = 180): TrendSeries {
  return aggregateHistory(retailParts(category), days)
}

export interface TierTrend {
  label: string
  /** MSRP range of the tier, for the panel subtitle. */
  min: number
  max: number
  partCount: number
  dates: string[]
  /** Median price indexed to 100 at the first day. */
  index: number[]
}

/**
 * Splits a category into price tiers (thirds by MSRP) and returns each tier's median
 * price indexed to 100 at the start of the window, so tiers share one y-axis.
 * Returns [] when the category is too small to split meaningfully.
 */
export function tierTrends(category: PartCategory, days = 180): TierTrend[] {
  const priced = retailParts(category)
    .filter((p) => p.price != null && getPriceHistory(p).length > 0)
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
  if (priced.length < 6) return []
  const labels = ['Budget', 'Mid-range', 'Premium']
  return labels.map((label, t) => {
    const slice = priced.slice(Math.floor((priced.length * t) / 3), Math.floor((priced.length * (t + 1)) / 3))
    const agg = aggregateHistory(slice, days)
    const base = agg.median[0] || 1
    return {
      label,
      min: slice[0].price ?? 0,
      max: slice[slice.length - 1].price ?? 0,
      partCount: agg.partCount,
      dates: agg.dates,
      index: agg.median.map((m) => (m / base) * 100),
    }
  })
}

export function formatPct(p: number, digits = 1): string {
  const v = (p * 100).toFixed(digits)
  return `${p > 0 ? '+' : p < 0 ? '−' : ''}${v.replace('-', '')}%`
}
