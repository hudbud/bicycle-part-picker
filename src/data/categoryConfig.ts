import type { PartCategory } from '@/types/parts'
import type { BikeType } from '@/types/build'

export type CategoryGroup = 'Frameset' | 'Wheels & Tires' | 'Drivetrain' | 'Brakes' | 'Cockpit' | 'Contact Points'

export interface CategoryMeta {
  id: PartCategory
  /** Singular display label: "Rear Derailleur". */
  label: string
  /** Plural used for browse page titles: "Rear Derailleurs". */
  plural: string
  /** URL segment for /products/:slug. */
  slug: string
  group: CategoryGroup
  /** Units added by default when a part is chosen (tires, rotors = 2). */
  defaultQty?: number
  /** Short explainer shown on the products index and empty browse pages. */
  blurb: string
  required: boolean
}

/** Builder rows, in PCPartPicker-style list order. */
export const ALL_CATEGORIES: CategoryMeta[] = [
  { id: 'frame', label: 'Frame', plural: 'Frames', slug: 'frame', group: 'Frameset', required: true, blurb: 'The foundation — sets your wheel size, axle, brake and bottom bracket standards.' },
  { id: 'fork', label: 'Fork', plural: 'Forks', slug: 'fork', group: 'Frameset', required: true, blurb: 'Rigid or suspension. Must match your frame’s steerer and your front wheel’s axle.' },
  { id: 'rearShock', label: 'Rear Shock', plural: 'Rear Shocks', slug: 'rear-shock', group: 'Frameset', required: false, blurb: 'Full-suspension frames only. Eye-to-eye, stroke and mount must match the frame.' },
  { id: 'headset', label: 'Headset', plural: 'Headsets', slug: 'headset', group: 'Frameset', required: false, blurb: 'The bearings your fork steers on. Sized to the frame’s head tube standard.' },
  { id: 'wheels', label: 'Wheelset', plural: 'Wheelsets', slug: 'wheelset', group: 'Wheels & Tires', required: true, blurb: 'Front and rear wheel pair. Axles, freehub and brake interface all need to match.' },
  { id: 'tires', label: 'Tires', plural: 'Tires', slug: 'tires', group: 'Wheels & Tires', defaultQty: 2, required: true, blurb: 'Priced per tire. Check your frame and fork clearance before going wide.' },
  { id: 'crankset', label: 'Crankset', plural: 'Cranksets', slug: 'crankset', group: 'Drivetrain', required: true, blurb: 'Arms and chainrings. The spindle standard decides which bottom bracket you need.' },
  { id: 'bottomBracket', label: 'Bottom Bracket', plural: 'Bottom Brackets', slug: 'bottom-bracket', group: 'Drivetrain', required: true, blurb: 'Adapts your crank spindle to the frame’s BB shell.' },
  { id: 'chain', label: 'Chain', plural: 'Chains', slug: 'chain', group: 'Drivetrain', required: true, blurb: 'Speed count must match your cassette.' },
  { id: 'cassette', label: 'Cassette', plural: 'Cassettes', slug: 'cassette', group: 'Drivetrain', required: false, blurb: 'Rear cogs. Needs the right freehub body on your rear wheel.' },
  { id: 'sprocket', label: 'Sprocket / Cog', plural: 'Sprockets & Cogs', slug: 'sprocket', group: 'Drivetrain', required: false, blurb: 'Single-speed and track cogs, instead of a cassette.' },
  { id: 'rearDerailleur', label: 'Rear Derailleur', plural: 'Rear Derailleurs', slug: 'rear-derailleur', group: 'Drivetrain', required: false, blurb: 'Must share a shift system with your shifters and clear your biggest cog.' },
  { id: 'frontDerailleur', label: 'Front Derailleur', plural: 'Front Derailleurs', slug: 'front-derailleur', group: 'Drivetrain', required: false, blurb: 'Only for 2x drivetrains. Check your frame’s mount type.' },
  { id: 'shifters', label: 'Shifters / Levers', plural: 'Shifters & Levers', slug: 'shifters', group: 'Drivetrain', required: false, blurb: 'Drop-bar levers usually also actuate your brakes; flat-bar triggers don’t.' },
  { id: 'brakes', label: 'Brakes', plural: 'Brakes', slug: 'brakes', group: 'Brakes', required: true, blurb: 'Priced as a front + rear set. Caliper mount must match your frame and fork.' },
  { id: 'rotors', label: 'Rotors', plural: 'Rotors', slug: 'rotors', group: 'Brakes', defaultQty: 2, required: false, blurb: 'Priced per rotor. Center Lock or 6-bolt — match your hubs.' },
  { id: 'handlebars', label: 'Handlebars', plural: 'Handlebars', slug: 'handlebars', group: 'Cockpit', required: true, blurb: 'Drop, flat or riser. Clamp diameter must match your stem.' },
  { id: 'stem', label: 'Stem', plural: 'Stems', slug: 'stem', group: 'Cockpit', required: true, blurb: 'Length and angle set your reach. Clamp must match your bars.' },
  { id: 'seatpost', label: 'Seatpost', plural: 'Seatposts', slug: 'seatpost', group: 'Contact Points', required: true, blurb: 'Rigid or dropper. Diameter must match your frame’s seat tube exactly.' },
  { id: 'saddle', label: 'Saddle', plural: 'Saddles', slug: 'saddle', group: 'Contact Points', required: true, blurb: 'The most personal part of the bike.' },
  { id: 'pedals', label: 'Pedals', plural: 'Pedals', slug: 'pedals', group: 'Contact Points', required: false, blurb: 'Clipless or flat. Priced as a pair.' },
]

/** Rows that replace "Wheelset" when the builder's wheels are split into components. */
export const WHEEL_SUB_CATEGORIES: CategoryMeta[] = [
  { id: 'frontWheel', label: 'Front Wheel', plural: 'Wheels', slug: 'wheelset', group: 'Wheels & Tires', required: false, blurb: 'Any wheel from the wheelset catalog.' },
  { id: 'rearWheel', label: 'Rear Wheel', plural: 'Wheels', slug: 'wheelset', group: 'Wheels & Tires', required: false, blurb: 'Any wheel from the wheelset catalog.' },
  { id: 'hub', label: 'Hubs', plural: 'Hubs', slug: 'hubs', group: 'Wheels & Tires', required: false, blurb: 'For hand-built wheels.' },
  { id: 'rim', label: 'Rims', plural: 'Rims', slug: 'rims', group: 'Wheels & Tires', defaultQty: 2, required: false, blurb: 'For hand-built wheels. Priced per rim.' },
  { id: 'spokes', label: 'Spokes', plural: 'Spokes', slug: 'spokes', group: 'Wheels & Tires', required: false, blurb: 'For hand-built wheels. Priced per wheelset’s worth.' },
]

/** Everything that has its own /products/:slug browse page. */
export const BROWSABLE_CATEGORIES: CategoryMeta[] = [
  ...ALL_CATEGORIES,
  ...WHEEL_SUB_CATEGORIES.filter((c) => c.id === 'hub' || c.id === 'rim' || c.id === 'spokes'),
]

const ALL_META: CategoryMeta[] = [...ALL_CATEGORIES, ...WHEEL_SUB_CATEGORIES]

export const CATEGORY_GROUPS: CategoryGroup[] = ['Frameset', 'Wheels & Tires', 'Drivetrain', 'Brakes', 'Cockpit', 'Contact Points']

/** @deprecated Bike-type templates removed — always returns the full category list. */
export function getCategoriesForBikeType(_bikeType?: BikeType): CategoryMeta[] {
  return ALL_CATEGORIES
}

export function getCategoryMeta(category: PartCategory): CategoryMeta | undefined {
  return ALL_META.find((c) => c.id === category)
}

export function getCategoryLabel(category: PartCategory): string | null {
  return getCategoryMeta(category)?.label ?? null
}

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return BROWSABLE_CATEGORIES.find((c) => c.slug === slug)
}

/** Browse URL for a category. frontWheel/rearWheel browse the wheelset catalog. */
export function productsPath(category: PartCategory): string {
  return `/products/${getCategoryMeta(category)?.slug ?? category}`
}

export function productPath(partId: string): string {
  return `/product/${encodeURIComponent(partId)}`
}

export function defaultQuantity(category: PartCategory): number {
  return getCategoryMeta(category)?.defaultQty ?? 1
}
