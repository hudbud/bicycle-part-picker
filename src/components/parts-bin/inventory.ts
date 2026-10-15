import type { Part, PartCategory } from '@/types/parts'
import type { Build, PartStatus, PartTracking } from '@/types/build'
import type { BinItem } from '@/store/partsBinStore'
import type { BikeRef } from '@/store/bikeSync'
import { ALL_CATEGORIES, WHEEL_SUB_CATEGORIES, getCategoryLabel } from '@/data/categoryConfig'
import { getPartPrice, ACQUIRED_STATUSES } from '@/data/pricing'

/** Statuses for a loose parts-bin item. */
export const BIN_STATUSES: { value: PartStatus; label: string; hint: string }[] = [
  { value: 'owned', label: 'Owned', hint: 'you have it' },
  { value: 'purchased', label: 'Purchased', hint: 'bought, on its way' },
  { value: 'partsbin', label: 'In Parts Bin', hint: 'a spare, not earmarked' },
  { value: 'wanted', label: 'Wanted', hint: 'wishlist, still to buy' },
]

export const binStatusLabel = (s: PartStatus) => BIN_STATUSES.find((o) => o.value === s)?.label ?? s

/** One row of the inventory: a loose bin item, or a part installed on a bike. */
export type InventoryRow =
  | {
      kind: 'bin'
      key: string
      part: Part
      category: PartCategory
      status: PartStatus
      quantity: number
      tracking?: PartTracking
      notes?: string
      addedAt: string
      item: BinItem
    }
  | {
      kind: 'bike'
      key: string
      part: Part
      category: PartCategory
      status: PartStatus
      quantity: number
      tracking?: PartTracking
      notes?: undefined
      addedAt?: undefined
      bike: Build
      ref: BikeRef
    }

const CATEGORY_ORDER = new Map<PartCategory, number>(
  [...ALL_CATEGORIES.slice(0, 5), ...WHEEL_SUB_CATEGORIES, ...ALL_CATEGORIES.slice(5)].map((c, i) => [c.id, i]),
)
export const categoryOrder = (c: PartCategory) => CATEGORY_ORDER.get(c) ?? 999
export const categoryName = (c: PartCategory) => getCategoryLabel(c) ?? c

/**
 * The bikes to list parts from and install onto: every garage bike, plus the builder's bike
 * when it isn't saved yet (a saved builder bike is the garage bike's twin — `updateBike`
 * keeps the two in sync, so it's listed once, as the garage bike).
 */
export function trackedBikes(garage: Build[], current: Build): { bike: Build; ref: BikeRef; label: string }[] {
  const out: { bike: Build; ref: BikeRef; label: string }[] = garage.map((b) => ({
    bike: b,
    ref: { kind: 'garage', id: b.id! },
    label: b.name || 'Untitled bike',
  }))
  const saved = current.id && garage.some((b) => b.id === current.id)
  if (!saved) out.unshift({ bike: current, ref: { kind: 'current' }, label: `${current.name || 'My Build'} (Builder, unsaved)` })
  return out
}

/** Bin items + acquired parts on bikes, as one inventory. */
export function inventoryRows(items: BinItem[], garage: Build[], current: Build): InventoryRow[] {
  const rows: InventoryRow[] = items.map((item) => ({
    kind: 'bin',
    key: `bin:${item.id}`,
    part: item.part,
    category: item.part.category,
    status: item.status,
    quantity: item.quantity ?? 1,
    tracking: item.tracking,
    notes: item.notes,
    addedAt: item.addedAt,
    item,
  }))
  for (const { bike, ref } of trackedBikes(garage, current)) {
    for (const s of bike.components) {
      if (!s.part || !s.status || !ACQUIRED_STATUSES.has(s.status)) continue
      rows.push({
        kind: 'bike',
        key: `bike:${ref.kind === 'garage' ? ref.id : 'current'}:${s.category}`,
        part: s.part,
        category: s.category,
        status: s.status,
        quantity: s.quantity && s.quantity > 0 ? s.quantity : 1,
        tracking: s.tracking,
        bike,
        ref,
      })
    }
  }
  return rows
}

/** Today's best price × quantity (used-market value for discontinued parts). */
export function marketValue(part: Part, quantity: number): number | undefined {
  const unit = getPartPrice(part)
  return unit == null ? undefined : Math.round(unit * quantity * 100) / 100
}

export const bikeHref = (ref: BikeRef) => (ref.kind === 'garage' ? `/garage/${encodeURIComponent(ref.id)}` : '/build')

/**
 * Builder slots a part can go into on `bike`. A wheelset part fits the Wheelset row, or the
 * Front / Rear Wheel rows when the bike's wheels are split; everything else uses its own category.
 */
export function slotsFor(part: Part, bike: Build): PartCategory[] {
  if (part.category === 'wheels' || part.category === 'frontWheel' || part.category === 'rearWheel') {
    return bike.wheelsExpanded ? ['frontWheel', 'rearWheel'] : ['wheels']
  }
  return [part.category]
}

/** "Hubs" etc. only show in the builder when the bike's wheels are split. */
export function slotHiddenOn(category: PartCategory, bike: Build): boolean {
  const sub = WHEEL_SUB_CATEGORIES.some((c) => c.id === category)
  return sub ? !bike.wheelsExpanded : false
}
