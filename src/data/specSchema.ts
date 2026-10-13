import type { Part, PartAttrs, PartCategory, WheelSize } from '@/types/parts'

export const WHEEL_SIZE_LABELS: Record<WheelSize, string> = {
  622: '700c / 29"',
  584: '650b / 27.5"',
  559: '26"',
  507: '24"',
  406: '20"',
}

export function formatWheelSize(size: WheelSize): string {
  return WHEEL_SIZE_LABELS[size] ?? `${size}mm BSD`
}

export function formatWeight(grams: number | undefined): string {
  if (grams == null) return '—'
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

type SpecValue = string | number | boolean | string[] | number[] | undefined

/**
 * One displayable / filterable property of a part.
 * - `filter: 'enum'` → checkbox list of distinct values (arrays are exploded)
 * - `filter: 'range'` → min/max numeric filter
 * - `filter: 'bool'` → Yes/No checkboxes
 * - `column: true` → shown as a column on the browse table
 */
export interface SpecField {
  key: keyof PartAttrs | 'weightG' | 'year'
  label: string
  filter?: 'enum' | 'range' | 'bool'
  column?: boolean
  unit?: string
}

const material: SpecField = { key: 'material', label: 'Material', filter: 'enum', column: true }
const weight: SpecField = { key: 'weightG', label: 'Weight', filter: 'range', column: true, unit: 'g' }
const speeds: SpecField = { key: 'speeds', label: 'Speeds', filter: 'enum', column: true }
const wheelSize: SpecField = { key: 'wheelSize', label: 'Wheel Size', filter: 'enum', column: true }
const disciplines: SpecField = { key: 'disciplines', label: 'Use', filter: 'enum' }
const year: SpecField = { key: 'year', label: 'Year' }
const color: SpecField = { key: 'color', label: 'Color' }

export const SPEC_SCHEMA: Record<PartCategory, SpecField[]> = {
  frame: [
    disciplines, material,
    { key: 'suspension', label: 'Suspension', filter: 'enum', column: true },
    { key: 'wheelSizes', label: 'Wheel Sizes', filter: 'enum', column: true },
    { key: 'maxTireMm', label: 'Max Tire', filter: 'range', column: true, unit: 'mm' },
    { key: 'bbShell', label: 'BB Shell', filter: 'enum' },
    { key: 'rearAxle', label: 'Rear Axle', filter: 'enum' },
    { key: 'brakeMount', label: 'Brake Mount', filter: 'enum' },
    { key: 'headsetStd', label: 'Headset', filter: 'enum' },
    { key: 'steerer', label: 'Steerer', filter: 'enum' },
    { key: 'seatpostMm', label: 'Seatpost Ø', filter: 'enum', unit: 'mm' },
    { key: 'travelMm', label: 'Rear Travel', filter: 'range', unit: 'mm' },
    { key: 'maxForkTravelMm', label: 'Max Fork Travel', unit: 'mm' },
    { key: 'shockSize', label: 'Shock Size', filter: 'enum' },
    { key: 'shockMount', label: 'Shock Mount' },
    { key: 'udh', label: 'UDH', filter: 'bool' },
    { key: 'derailleurHanger', label: 'Derailleur Hanger' },
    { key: 'frontDerailleurMount', label: 'Front Derailleur Mount', filter: 'enum' },
    { key: 'maxRotorMm', label: 'Max Rotor', unit: 'mm' },
    weight, year, color,
  ],
  fork: [
    disciplines, material,
    { key: 'travelMm', label: 'Travel', filter: 'range', column: true, unit: 'mm' },
    { key: 'wheelSizes', label: 'Wheel Sizes', filter: 'enum', column: true },
    { key: 'steerer', label: 'Steerer', filter: 'enum' },
    { key: 'frontAxle', label: 'Axle', filter: 'enum', column: true },
    { key: 'brakeMount', label: 'Brake Mount', filter: 'enum' },
    { key: 'maxTireMm', label: 'Max Tire', filter: 'range', unit: 'mm' },
    { key: 'springType', label: 'Spring', filter: 'enum' },
    { key: 'maxRotorMm', label: 'Max Rotor', unit: 'mm' },
    weight, year,
  ],
  rearShock: [
    { key: 'shockSize', label: 'Size', filter: 'enum', column: true },
    { key: 'shockMount', label: 'Mount', filter: 'enum', column: true },
    { key: 'springType', label: 'Spring', filter: 'enum', column: true },
    weight, year,
  ],
  headset: [
    { key: 'headsetStd', label: 'Standard', filter: 'enum', column: true },
    { key: 'steerer', label: 'Steerer', filter: 'enum', column: true },
    material, weight, color,
  ],
  wheels: [
    disciplines, wheelSize, material,
    { key: 'rimDepthMm', label: 'Rim Depth', filter: 'range', column: true, unit: 'mm' },
    { key: 'rimInternalMm', label: 'Internal Width', filter: 'range', column: true, unit: 'mm' },
    { key: 'frontAxle', label: 'Front Axle', filter: 'enum' },
    { key: 'rearAxle', label: 'Rear Axle', filter: 'enum' },
    { key: 'freehub', label: 'Freehub', filter: 'enum' },
    { key: 'rotorInterface', label: 'Brake Interface', filter: 'enum' },
    { key: 'tubeless', label: 'Tubeless Ready', filter: 'bool' },
    weight, year,
  ],
  frontWheel: [],
  rearWheel: [],
  hub: [
    { key: 'frontAxle', label: 'Front Axle', filter: 'enum', column: true },
    { key: 'rearAxle', label: 'Rear Axle', filter: 'enum', column: true },
    { key: 'freehub', label: 'Freehub', filter: 'enum', column: true },
    { key: 'rotorInterface', label: 'Brake Interface', filter: 'enum' },
    weight,
  ],
  rim: [
    wheelSize, material,
    { key: 'rimInternalMm', label: 'Internal Width', filter: 'range', column: true, unit: 'mm' },
    { key: 'rimDepthMm', label: 'Depth', filter: 'range', unit: 'mm' },
    { key: 'tubeless', label: 'Tubeless Ready', filter: 'bool' },
    weight,
  ],
  spokes: [material, weight],
  tires: [
    disciplines, wheelSize,
    { key: 'tireWidthMm', label: 'Width', filter: 'range', column: true, unit: 'mm' },
    { key: 'tubeless', label: 'Tubeless Ready', filter: 'bool', column: true },
    weight, year, color,
  ],
  crankset: [
    disciplines, speeds,
    { key: 'chainrings', label: 'Chainrings', column: true },
    { key: 'chainringCount', label: 'Rings', filter: 'enum' },
    { key: 'bbSpindle', label: 'Spindle', filter: 'enum', column: true },
    { key: 'crankLengthMm', label: 'Crank Length', unit: 'mm' },
    material, weight, year,
  ],
  bottomBracket: [
    { key: 'bbShell', label: 'Shell', filter: 'enum', column: true },
    { key: 'bbSpindle', label: 'Spindle', filter: 'enum', column: true },
    weight,
  ],
  chain: [
    speeds,
    { key: 'flattop', label: 'Flattop', filter: 'bool' },
    weight, color,
  ],
  cassette: [
    disciplines, speeds,
    { key: 'cassetteRange', label: 'Range', column: true },
    { key: 'freehub', label: 'Freehub', filter: 'enum', column: true },
    { key: 'largestCogT', label: 'Largest Cog', filter: 'range', unit: 'T' },
    weight, year,
  ],
  sprocket: [
    { key: 'smallestCogT', label: 'Teeth', filter: 'enum', column: true, unit: 'T' },
    { key: 'freehub', label: 'Fits', filter: 'enum', column: true },
    weight,
  ],
  rearDerailleur: [
    disciplines, speeds,
    { key: 'shiftSystem', label: 'Shift System', filter: 'enum', column: true },
    { key: 'maxCogT', label: 'Max Cog', filter: 'range', column: true, unit: 'T' },
    { key: 'electronic', label: 'Electronic', filter: 'bool' },
    { key: 'udhRequired', label: 'UDH Only', filter: 'bool' },
    weight, year,
  ],
  frontDerailleur: [
    speeds,
    { key: 'frontDerailleurMount', label: 'Mount', filter: 'enum', column: true },
    { key: 'electronic', label: 'Electronic', filter: 'bool', column: true },
    weight,
  ],
  shifters: [
    disciplines, speeds,
    { key: 'shiftSystem', label: 'Shift System', filter: 'enum', column: true },
    { key: 'handlebarType', label: 'Bar Type', filter: 'enum', column: true },
    { key: 'brakeType', label: 'Brake Lever', filter: 'enum' },
    { key: 'electronic', label: 'Electronic', filter: 'bool' },
    weight, year,
  ],
  brakes: [
    disciplines,
    { key: 'brakeType', label: 'Type', filter: 'enum', column: true },
    { key: 'brakeMount', label: 'Mount', filter: 'enum', column: true },
    weight, year,
  ],
  rotors: [
    { key: 'rotorSizeMm', label: 'Size', filter: 'enum', column: true, unit: 'mm' },
    { key: 'rotorInterface', label: 'Mount', filter: 'enum', column: true },
    weight,
  ],
  handlebars: [
    disciplines, material,
    { key: 'handlebarType', label: 'Type', filter: 'enum', column: true },
    { key: 'barClampMm', label: 'Clamp', filter: 'enum', column: true, unit: 'mm' },
    { key: 'barWidthMm', label: 'Width', filter: 'range', column: true, unit: 'mm' },
    weight, color,
  ],
  stem: [
    material,
    { key: 'stemLengthMm', label: 'Length', filter: 'range', column: true, unit: 'mm' },
    { key: 'stemAngleDeg', label: 'Angle', filter: 'enum', column: true, unit: '°' },
    { key: 'barClampMm', label: 'Bar Clamp', filter: 'enum', column: true, unit: 'mm' },
    { key: 'steerer', label: 'Steerer', filter: 'enum' },
    weight, color,
  ],
  seatpost: [
    material,
    { key: 'seatpostMm', label: 'Diameter', filter: 'enum', column: true, unit: 'mm' },
    { key: 'dropper', label: 'Dropper', filter: 'bool', column: true },
    { key: 'travelMm', label: 'Travel', filter: 'range', unit: 'mm' },
    { key: 'setbackMm', label: 'Setback', unit: 'mm' },
    weight,
  ],
  dropperPost: [],
  saddle: [
    disciplines,
    { key: 'saddleWidthMm', label: 'Width', filter: 'range', column: true, unit: 'mm' },
    { key: 'railMaterial', label: 'Rails', filter: 'enum', column: true },
    weight, color,
  ],
  pedals: [
    disciplines,
    { key: 'pedalSystem', label: 'System', filter: 'enum', column: true },
    material, weight,
  ],
}

/** frontWheel / rearWheel share the wheelset schema. */
export function getSpecFields(category: PartCategory): SpecField[] {
  if (category === 'frontWheel' || category === 'rearWheel') return SPEC_SCHEMA.wheels
  return SPEC_SCHEMA[category] ?? []
}

export function getSpecValue(part: Part, key: SpecField['key']): SpecValue {
  if (key === 'weightG') return part.weightG
  if (key === 'year') return part.year
  return part.attrs?.[key] as SpecValue
}

/** Human formatting for one spec value. Returns '—' for missing values. */
export function formatSpecValue(field: SpecField, value: SpecValue): string {
  if (value == null || (Array.isArray(value) && value.length === 0)) return '—'
  if (field.key === 'weightG') return formatWeight(value as number)
  if (field.key === 'wheelSize') return formatWheelSize(value as WheelSize)
  if (field.key === 'wheelSizes') return (value as WheelSize[]).map(formatWheelSize).join(', ')
  if (field.key === 'material') return cap(String(value))
  if (field.key === 'disciplines') return (value as string[]).map((d) => (d === 'mtb' ? 'MTB' : cap(d))).join(', ')
  if (field.key === 'speeds') return value === 1 ? 'Single' : `${value}-speed`
  if (field.key === 'chainringCount') return `${value}x`
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  return field.unit ? `${value}${field.unit === '°' || field.unit === 'T' ? '' : ' '}${field.unit}` : String(value)
}

/** Format a single enum facet value (used in filter checkbox labels). */
export function formatFacetValue(field: SpecField, value: string | number | boolean): string {
  if (field.key === 'wheelSizes' || field.key === 'wheelSize') return formatWheelSize(value as WheelSize)
  if (field.key === 'disciplines') return value === 'mtb' ? 'MTB' : cap(String(value))
  return formatSpecValue(field, value as SpecValue)
}

/** One-line spec summary for a part, e.g. "Carbon · 12-speed · 790 g" — used in lists and autocomplete. */
export function summarizeSpecs(part: Part, max = 3): string {
  return getSpecFields(part.category)
    .filter((f) => f.column && f.key !== 'weightG')
    .map((f) => ({ f, v: getSpecValue(part, f.key) }))
    .filter(({ v }) => v != null && !(Array.isArray(v) && v.length === 0))
    .slice(0, max)
    .map(({ f, v }) => formatSpecValue(f, v))
    .join(' · ')
}
