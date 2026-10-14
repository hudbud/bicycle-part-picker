import type { Build, ComponentSlot } from '@/types/build'
import type { Part, PartCategory } from '@/types/parts'
import type { CompatIssue, IssueSeverity } from '@/compat/engine'
import { worstSeverity } from '@/compat/engine'
import type { BuildCompat } from '@/hooks/useCompat'
import { getCategoryLabel, productsPath, WHEEL_SUB_CATEGORIES, defaultQuantity } from '@/data/categoryConfig'
import { resolvePart } from '@/data/partsDatabase'
import { getBestOffer, getPartPrice, getSlotPrice, slotQuantity, type Offer } from '@/data/pricing'

/**
 * Pure helpers that turn a Build into display rows. Shared by the editable builder
 * table, the read-only BuildPartList, exports and markup so they all agree on
 * labels, live prices, retailers, weights and per-row compatibility.
 */

const WHEEL_SUB_IDS = new Set<PartCategory>(WHEEL_SUB_CATEGORIES.map((c) => c.id))

export function slotLabel(category: PartCategory): string {
  return getCategoryLabel(category) ?? category
}

/** Hub / rim / spokes / front & rear wheel rows that replace "Wheelset" when split. */
export function isWheelSubCategory(category: PartCategory): boolean {
  return WHEEL_SUB_IDS.has(category)
}

/** True for slots where a quantity stepper makes sense (tires, rotors, rims…). */
export function isMultiQuantity(slot: ComponentSlot): boolean {
  return defaultQuantity(slot.category) > 1 || slotQuantity(slot) > 1
}

/**
 * Where "Choose A …" sends you. Split front/rear wheels browse the wheelset catalog
 * with `?slot=` so the browse page's Add button fills the right row.
 */
export function choosePath(category: PartCategory): string {
  if (category === 'frontWheel' || category === 'rearWheel') return `${productsPath(category)}?slot=${category}`
  return productsPath(category)
}

/** "Brand Name" without a stray space when brand is blank. */
export function partTitle(part: Pick<Part, 'brand' | 'name'>): string {
  // Some names already lead with the brand ("Rene Herse Double Crankset").
  if (part.brand && part.name.toLowerCase().startsWith(part.brand.toLowerCase())) return part.name
  return [part.brand, part.name].filter(Boolean).join(' ')
}

export interface SlotRow {
  slot: ComponentSlot
  category: PartCategory
  label: string
  isWheelSub: boolean
  /** Live catalog entry (or the custom part / unknown snapshot as stored). */
  part?: Part
  isCustom: boolean
  quantity: number
  unitPrice?: number
  /** unit price × quantity */
  price?: number
  /** Total grams for this row (× quantity), undefined when unknown. */
  weightG?: number
  /** Best in-stock retailer offer, catalog parts only. */
  offer?: Offer
  issues: CompatIssue[]
  severity?: IssueSeverity
}

export function getSlotRow(slot: ComponentSlot, compat?: BuildCompat): SlotRow {
  const part = slot.part ? resolvePart(slot.part) : undefined
  const quantity = slotQuantity(slot)
  const issues = compat ? compat.issuesFor(slot.category) : []
  return {
    slot,
    category: slot.category,
    label: slotLabel(slot.category),
    isWheelSub: isWheelSubCategory(slot.category),
    part,
    isCustom: !!part?.isCustom,
    quantity,
    unitPrice: getPartPrice(part),
    price: getSlotPrice(slot),
    weightG: part?.weightG != null ? part.weightG * quantity : undefined,
    offer: part && !part.isCustom ? getBestOffer(part) : undefined,
    issues,
    severity: worstSeverity(issues),
  }
}

/** One row per builder slot, in build order. Pass `filledOnly` for read-only lists. */
export function getSlotRows(build: Build, compat?: BuildCompat, filledOnly = false): SlotRow[] {
  return build.components
    .filter((s) => !filledOnly || s.part)
    .map((s) => getSlotRow(s, compat))
}

export type CompatLevel = 'empty' | 'ok' | 'warning' | 'error'

export function compatLevel(build: Build, compat: BuildCompat): CompatLevel {
  if (!build.components.some((s) => s.part)) return 'empty'
  if (compat.errors.length > 0) return 'error'
  if (compat.warnings.length > 0) return 'warning'
  return 'ok'
}

export const COMPAT_MESSAGES: Record<CompatLevel, string> = {
  empty: 'Add parts to check compatibility',
  ok: 'Compatibility: No issues or incompatibilities found.',
  warning: 'Compatibility: Warning! These parts have potential issues or incompatibilities. See details below.',
  error: 'Compatibility: Problem! These parts have compatibility issues. See details below.',
}

/** "8.42 kg", "8.42 kg+" when some parts have no listed weight, "—" when nothing is known. */
export function weightLabel(compat: BuildCompat): string {
  const { grams, unknown, formatted } = compat.weight
  if (grams === 0) return '—'
  return unknown > 0 ? `${formatted}+` : formatted
}

export function weightTooltip(compat: BuildCompat): string | undefined {
  const { grams, unknown } = compat.weight
  if (unknown === 0) return grams > 0 ? 'Sum of claimed weights × quantity' : undefined
  const parts = `${unknown} part${unknown === 1 ? '' : 's'}`
  return grams === 0
    ? `No weights listed yet for the ${parts} in this build`
    : `${parts} ${unknown === 1 ? 'has' : 'have'} no listed weight — the real total is higher`
}
