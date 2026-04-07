import type { Part, PartCategory } from './parts'

export type BikeType = 'road' | 'mtb' | 'gravel' | 'track' | 'bmx' | 'other'

export type PartStatus = 'owned' | 'purchased' | 'partsbin' | 'wanted'

export interface ComponentSlot {
  category: PartCategory
  part?: Part
  status?: PartStatus
}

export interface Build {
  id?: string
  name: string
  bikeType: BikeType
  description?: string
  isPublic: boolean
  components: ComponentSlot[]
  createdAt?: string
  updatedAt?: string
  ownerName?: string
}
