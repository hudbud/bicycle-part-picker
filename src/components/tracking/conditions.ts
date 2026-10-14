import type { PartCondition, PartStatus } from '@/types/build'

/** Display labels + badge colours for part condition, in "best → worst" order. */
export const CONDITIONS: { value: PartCondition; label: string; short: string; color: string; title: string }[] = [
  { value: 'new', label: 'New', short: 'New', color: '#006000', title: 'New, bought new' },
  { value: 'nos', label: 'NOS', short: 'NOS', color: '#008080', title: 'New old stock: never used, but old' },
  { value: 'used-good', label: 'Used – good', short: 'Used·good', color: '#000080', title: 'Used, in good working order' },
  { value: 'used-fair', label: 'Used – fair', short: 'Used·fair', color: '#806000', title: 'Used, worn but serviceable' },
  { value: 'needs-work', label: 'Needs work', short: 'Needs work', color: '#a00000', title: 'Needs service or repair before use' },
]

const BY_VALUE = new Map(CONDITIONS.map((c) => [c.value, c]))

export function conditionMeta(c: PartCondition) {
  return BY_VALUE.get(c) ?? { value: c, label: c, short: c, color: '#404040', title: c }
}

export const conditionLabel = (c: PartCondition) => conditionMeta(c).label

/** Status options for a bike slot. `undefined` = planned / still to buy. */
export const STATUS_OPTIONS: { value: PartStatus | ''; label: string }[] = [
  { value: '', label: 'Planned (to buy)' },
  { value: 'wanted', label: 'Wanted' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'owned', label: 'Owned' },
  { value: 'partsbin', label: 'In Parts Bin' },
]

/** Common sources for the Source field's suggestions. */
export const SOURCE_SUGGESTIONS = [
  'LBS',
  'eBay',
  'Pinkbike',
  'r/bikeswap',
  "The Pro's Closet",
  'Facebook Marketplace',
  'Craigslist',
  'Came with the frame',
  'Came with the bike',
  'Parts bin',
  'Gift',
]
