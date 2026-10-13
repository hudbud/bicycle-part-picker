import type { Part, PartCategory } from './parts'

export type BikeType = 'road' | 'mtb' | 'gravel' | 'track' | 'bmx' | 'other'

export type PartStatus = 'owned' | 'purchased' | 'partsbin' | 'wanted'

export interface ComponentSlot {
  category: PartCategory
  part?: Part
  status?: PartStatus
  /** Units of the part (tires and rotors default to 2). Omitted = 1. */
  quantity?: number
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
  components: ComponentSlot[]
  wheelsExpanded?: boolean
  additionalItems?: AdditionalItem[]
  photo?: string
  createdAt?: string
  updatedAt?: string
  ownerName?: string
}

/** A curated build in the Build Guides section. */
export interface BuildGuide {
  id: string
  title: string
  /** One-line pitch shown on cards. */
  summary: string
  /** Longer write-up: why these parts, what to upgrade first. Paragraphs separated by blank lines. */
  body: string
  tier: 'entry' | 'mid' | 'enthusiast' | 'dream'
  build: Build
}

/** A completed build posted by a (seeded) community member. */
export interface CommunityBuild {
  id: string
  author: string
  publishedAt: string
  likes: number
  comments: number
  /** The rider's write-up. Paragraphs separated by blank lines. */
  story: string
  /** Optional rider-reported actual weight in grams (vs. our estimate). */
  actualWeightG?: number
  build: Build
}
