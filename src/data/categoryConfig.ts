import type { PartCategory } from '@/types/parts'
import type { BikeType } from '@/types/build'

export interface CategoryMeta {
  id: PartCategory
  label: string
  required: boolean
}

const ROAD_CATEGORIES: CategoryMeta[] = [
  { id: 'frame', label: 'Frame', required: true },
  { id: 'fork', label: 'Fork', required: true },
  { id: 'wheels', label: 'Wheelset', required: true },
  { id: 'tires', label: 'Tires', required: true },
  { id: 'crankset', label: 'Crankset', required: true },
  { id: 'bottomBracket', label: 'Bottom Bracket', required: false },
  { id: 'chain', label: 'Chain', required: false },
  { id: 'cassette', label: 'Cassette', required: true },
  { id: 'handlebars', label: 'Handlebars', required: true },
  { id: 'stem', label: 'Stem', required: true },
  { id: 'saddle', label: 'Saddle', required: true },
  { id: 'seatpost', label: 'Seatpost', required: true },
  { id: 'pedals', label: 'Pedals', required: true },
  { id: 'brakes', label: 'Brakes', required: true },
]

const MTB_CATEGORIES: CategoryMeta[] = [
  { id: 'frame', label: 'Frame', required: true },
  { id: 'fork', label: 'Suspension Fork', required: true },
  { id: 'rearShock', label: 'Rear Shock', required: false },
  { id: 'wheels', label: 'Wheelset', required: true },
  { id: 'tires', label: 'Tires', required: true },
  { id: 'crankset', label: 'Crankset', required: true },
  { id: 'bottomBracket', label: 'Bottom Bracket', required: false },
  { id: 'chain', label: 'Chain', required: false },
  { id: 'cassette', label: 'Cassette', required: true },
  { id: 'handlebars', label: 'Handlebars', required: true },
  { id: 'stem', label: 'Stem', required: true },
  { id: 'saddle', label: 'Saddle', required: true },
  { id: 'seatpost', label: 'Seatpost / Dropper', required: true },
  { id: 'pedals', label: 'Pedals', required: true },
  { id: 'brakes', label: 'Brakes', required: true },
]

const GRAVEL_CATEGORIES: CategoryMeta[] = [
  { id: 'frame', label: 'Frame', required: true },
  { id: 'fork', label: 'Fork', required: true },
  { id: 'wheels', label: 'Wheelset', required: true },
  { id: 'tires', label: 'Tires', required: true },
  { id: 'crankset', label: 'Crankset', required: true },
  { id: 'bottomBracket', label: 'Bottom Bracket', required: false },
  { id: 'chain', label: 'Chain', required: false },
  { id: 'cassette', label: 'Cassette', required: true },
  { id: 'handlebars', label: 'Handlebars', required: true },
  { id: 'stem', label: 'Stem', required: true },
  { id: 'saddle', label: 'Saddle', required: true },
  { id: 'seatpost', label: 'Seatpost', required: true },
  { id: 'pedals', label: 'Pedals', required: true },
  { id: 'brakes', label: 'Brakes', required: true },
]

const TRACK_CATEGORIES: CategoryMeta[] = [
  { id: 'frame', label: 'Frame', required: true },
  { id: 'fork', label: 'Fork', required: true },
  { id: 'wheels', label: 'Wheelset', required: true },
  { id: 'tires', label: 'Tires', required: true },
  { id: 'crankset', label: 'Crankset', required: true },
  { id: 'bottomBracket', label: 'Bottom Bracket', required: false },
  { id: 'chain', label: 'Chain', required: false },
  { id: 'sprocket', label: 'Sprocket', required: true },
  { id: 'handlebars', label: 'Handlebars', required: true },
  { id: 'stem', label: 'Stem', required: true },
  { id: 'saddle', label: 'Saddle', required: true },
  { id: 'seatpost', label: 'Seatpost', required: true },
  { id: 'pedals', label: 'Pedals', required: true },
]

const BMX_CATEGORIES: CategoryMeta[] = [
  { id: 'frame', label: 'Frame', required: true },
  { id: 'fork', label: 'Fork', required: true },
  { id: 'handlebars', label: 'Bars', required: true },
  { id: 'stem', label: 'Stem', required: true },
  { id: 'crankset', label: 'Cranks', required: true },
  { id: 'chain', label: 'Chain', required: true },
  { id: 'sprocket', label: 'Sprocket', required: true },
  { id: 'wheels', label: 'Wheels', required: true },
  { id: 'pedals', label: 'Pedals', required: true },
]

export const CATEGORY_CONFIG: Record<BikeType, CategoryMeta[]> = {
  road: ROAD_CATEGORIES,
  mtb: MTB_CATEGORIES,
  gravel: GRAVEL_CATEGORIES,
  track: TRACK_CATEGORIES,
  bmx: BMX_CATEGORIES,
  other: ROAD_CATEGORIES,
}

export function getCategoriesForBikeType(bikeType: BikeType): CategoryMeta[] {
  return CATEGORY_CONFIG[bikeType] ?? ROAD_CATEGORIES
}
