import type { Build, ComponentSlot } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import { kmOnPart, lastServiceFor } from '@/utils/bikeOps'

/**
 * Tiny, deliberately rough "is something due?" heuristics for the Garage. Only for bikes
 * with an odometer that aren't in planning / retired, and only when we actually know
 * the distance on the part — no guessing.
 *
 * | Part      | Due at   | Measured from                                            |
 * |-----------|----------|----------------------------------------------------------|
 * | Chain     | 3,000 km | install odometer / last "replaced" entry for the chain    |
 * | Cassette  | 9,000 km | install odometer / last "replaced" entry (≈ 3 chains)     |
 * | Tires     | 5,000 km | install odometer / last "replaced" entry                  |
 * | Brakes    | 2,500 km | last service-log entry of any kind touching the brakes,   |
 * |           |          | else install odometer ("check pads")                      |
 * | Whole bike| 365 days | last service-log entry of any kind (riding bikes only)    |
 *
 * "Soon" kicks in at 80 % of the interval.
 */

export interface DueHint {
  key: string
  category?: PartCategory
  /** "Chain due", "Tires soon" */
  label: string
  /** Distance (km) on the part, for tooltips. */
  km?: number
  level: 'due' | 'soon'
}

interface Rule {
  category: PartCategory
  name: string
  everyKm: number
  /** 'replaced' = distance since the part went on; 'any' = since any service entry for it. */
  basis: 'replaced' | 'any'
}

const RULES: Rule[] = [
  { category: 'chain', name: 'Chain', everyKm: 3000, basis: 'replaced' },
  { category: 'cassette', name: 'Cassette', everyKm: 9000, basis: 'replaced' },
  { category: 'tires', name: 'Tires', everyKm: 5000, basis: 'replaced' },
  { category: 'brakes', name: 'Brake pads', everyKm: 2500, basis: 'any' },
]

const SOON = 0.8
const YEAR_MS = 365 * 86400000

function distanceFor(build: Build, slot: ComponentSlot, rule: Rule): number | undefined {
  if (rule.basis === 'replaced') return kmOnPart(build, slot)
  const odo = build.odometerKm
  if (odo == null) return undefined
  const last = lastServiceFor(build, rule.category)
  const from = Math.max(last?.odometerKm ?? -1, slot.tracking?.installedAtKm ?? -1)
  return from < 0 ? undefined : Math.max(0, odo - from)
}

export function getDueHints(build: Build, now = Date.now()): DueHint[] {
  if (build.stage === 'planning' || build.stage === 'retired') return []
  const out: DueHint[] = []
  if (build.odometerKm != null) {
    for (const rule of RULES) {
      const slot = build.components.find((s) => s.category === rule.category)
      if (!slot?.part) continue
      const km = distanceFor(build, slot, rule)
      if (km == null || km < rule.everyKm * SOON) continue
      const level = km >= rule.everyKm ? 'due' : 'soon'
      out.push({ key: rule.category, category: rule.category, label: `${rule.name} ${level}`, km, level })
    }
  }
  if (build.stage === 'riding') {
    const last = build.serviceLog?.[0]
    const lastMs = last ? Date.parse(last.date) : NaN
    if (!last || now - lastMs > YEAR_MS) {
      out.push({ key: 'annual', label: last ? 'Tune-up due (1 yr+)' : 'No service logged', level: last ? 'due' : 'soon' })
    }
  }
  return out
}
