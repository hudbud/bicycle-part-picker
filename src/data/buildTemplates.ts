import type { Build } from '@/types/build'
import type { PartCategory } from '@/types/parts'

/**
 * Optional starting points for the builder's part list. A template only hides empty rows a
 * setup usually doesn't use — it doesn't label the bike, and any row can be added back.
 */
export interface BuildTemplate {
  id: string
  label: string
  hide: PartCategory[]
}

export const BUILD_TEMPLATES: BuildTemplate[] = [
  { id: 'geared-rim', label: 'Geared, rim brakes (road, touring, vintage MTB)', hide: ['rearShock', 'sprocket', 'rotors'] },
  { id: 'geared-disc', label: 'Geared, disc brakes (gravel, modern road, hardtail)', hide: ['rearShock', 'sprocket'] },
  { id: 'full-sus', label: 'Full suspension, 1x (trail, enduro)', hide: ['sprocket', 'frontDerailleur'] },
  { id: 'single', label: 'Singlespeed / fixed (track, BMX, cruiser)', hide: ['rearShock', 'cassette', 'rearDerailleur', 'frontDerailleur', 'shifters', 'rotors'] },
]

/** The template whose rows match the build's hidden rows: '' for every row, 'custom' for anything else. */
export function matchTemplate(build: Build): string {
  const hidden = new Set(build.hiddenRows ?? [])
  if (!hidden.size) return ''
  const t = BUILD_TEMPLATES.find((t) => t.hide.length === hidden.size && t.hide.every((c) => hidden.has(c)))
  return t?.id ?? 'custom'
}

/** Empty rows the builder is hiding right now. A row holding a part always shows. */
export function hiddenCategories(build: Build): PartCategory[] {
  const hidden = new Set(build.hiddenRows ?? [])
  return build.components.filter((s) => hidden.has(s.category) && !s.part).map((s) => s.category)
}
