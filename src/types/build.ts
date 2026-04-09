import type { Part, PartCategory } from './parts'

export type BikeType = 'road' | 'mtb' | 'gravel' | 'track' | 'bmx' | 'other'

export type PartStatus = 'owned' | 'purchased' | 'partsbin' | 'wanted'

export interface ComponentSlot {
  category: PartCategory
  part?: Part
  status?: PartStatus
}

export interface AdditionalItem {
  id: string
  name: string
  price?: number
  notes?: string
  url?: string
}

export interface Build {
  id?: string
  name: string
  bikeType: BikeType
  description?: string
  isPublic: boolean
  components: ComponentSlot[]
  wheelsExpanded?: boolean
  additionalItems?: AdditionalItem[]
  photo?: string
  createdAt?: string
  updatedAt?: string
  ownerName?: string
}
