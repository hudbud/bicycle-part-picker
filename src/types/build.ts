import type { Part, PartCategory } from './parts'

export type PartStatus = 'owned' | 'purchased' | 'partsbin' | 'wanted'

export type PartCondition = 'new' | 'nos' | 'used-good' | 'used-fair' | 'needs-work'

/**
 * What actually happened with a part you own: what you paid, where it came from, its
 * condition. Lives on build slots and parts-bin items and moves with the part between them.
 */
export interface PartTracking {
  /** Total paid for this slot's/item's quantity, USD. 0 = free / came with something. */
  pricePaid?: number
  /** Free text: "LBS", "eBay", "r/bikeswap", "came with the frame"… */
  source?: string
  /** YYYY-MM-DD */
  acquiredAt?: string
  condition?: PartCondition
  serial?: string
  notes?: string
  /** Bike odometer (km) when this part went on — for "km on this part". */
  installedAtKm?: number
}

export interface ComponentSlot {
  category: PartCategory
  part?: Part
  status?: PartStatus
  /** Units of the part (tires and rotors default to 2). Omitted = 1. */
  quantity?: number
  tracking?: PartTracking
}

export type ServiceKind = 'replaced' | 'serviced' | 'adjusted' | 'cleaned' | 'inspected' | 'repaired' | 'other'

/** One maintenance-log entry for a bike. */
export interface ServiceEntry {
  id: string
  /** YYYY-MM-DD */
  date: string
  kind: ServiceKind
  /** Short description: "New chain", "Fork lowers service". */
  title: string
  /** Slots this touched; empty/omitted = whole bike. */
  categories?: PartCategory[]
  /** Bike odometer (km) at the time. */
  odometerKm?: number
  cost?: number
  notes?: string
}

/**
 * A bike photo: either a public link (Imgur, Reddit…), which goes in share links, or an
 * upload kept on this device (IndexedDB, see `utils/photoStore`).
 */
export interface BikePhoto {
  id: string
  /** Public https image URL. */
  url?: string
  /** Key of an uploaded image in this device's photo store. */
  localKey?: string
  caption?: string
}

/** Where a bike is in its life. */
export type BuildStage = 'planning' | 'building' | 'riding' | 'retired'

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
  /** Empty part rows the builder doesn't show (from a template or hidden by hand). Rows holding a part always show. */
  hiddenRows?: PartCategory[]
  description?: string
  components: ComponentSlot[]
  wheelsExpanded?: boolean
  additionalItems?: AdditionalItem[]
  /** @deprecated Single data-URL photo from older saves; moved into `photos` on load. */
  photo?: string
  /** Bike photos, cover first. */
  photos?: BikePhoto[]
  createdAt?: string
  updatedAt?: string
  ownerName?: string
  stage?: BuildStage
  /** Current odometer, km (display unit is a user setting). */
  odometerKm?: number
  serviceLog?: ServiceEntry[]
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
