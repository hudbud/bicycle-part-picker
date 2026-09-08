import type { PartCategory } from '@/types/parts'
import type { BikeType } from '@/types/build'

export interface CategoryMeta {
  id: PartCategory
  label: string
  required: boolean
}

/** Superset of every category across all former bike-type templates. */
export const ALL_CATEGORIES: CategoryMeta[] = [
  { id: 'frame', label: 'Frame', required: false },
  { id: 'fork', label: 'Fork', required: false },
  { id: 'rearShock', label: 'Rear Shock', required: false },
  { id: 'wheels', label: 'Wheelset', required: false },
  { id: 'tires', label: 'Tires', required: false },
  { id: 'crankset', label: 'Crankset', required: false },
  { id: 'bottomBracket', label: 'Bottom Bracket', required: false },
  { id: 'chain', label: 'Chain', required: false },
  { id: 'cassette', label: 'Cassette', required: false },
  { id: 'sprocket', label: 'Sprocket', required: false },
  { id: 'handlebars', label: 'Handlebars', required: false },
  { id: 'stem', label: 'Stem', required: false },
  { id: 'saddle', label: 'Saddle', required: false },
  { id: 'seatpost', label: 'Seatpost', required: false },
  { id: 'pedals', label: 'Pedals', required: false },
  { id: 'brakes', label: 'Brakes', required: false },
]

/** @deprecated Bike-type templates removed — always returns the full category list. */
export const CATEGORY_CONFIG: Record<BikeType, CategoryMeta[]> = {
  road: ALL_CATEGORIES,
  mtb: ALL_CATEGORIES,
  gravel: ALL_CATEGORIES,
  track: ALL_CATEGORIES,
  bmx: ALL_CATEGORIES,
  other: ALL_CATEGORIES,
}

export function getCategoriesForBikeType(_bikeType?: BikeType): CategoryMeta[] {
  return ALL_CATEGORIES
}

export function getCategoryLabel(category: PartCategory): string | null {
  return ALL_CATEGORIES.find((c) => c.id === category)?.label ?? null
}
