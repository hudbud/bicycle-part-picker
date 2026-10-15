import type { Build, ComponentSlot, PartTracking, ServiceEntry, BuildStage } from '@/types/build'
import type { PartCategory } from '@/types/parts'

/**
 * Pure Build → Build edits for the tracking side of a bike (part tracking, odometer,
 * stage, service log). Used by the builder store and by garage bike pages via `updateBike`.
 */

/** Drop undefined / empty-string fields; undefined if nothing is left. */
function compactTracking(t: PartTracking): PartTracking | undefined {
  const out: PartTracking = {}
  for (const [k, v] of Object.entries(t) as Array<[keyof PartTracking, PartTracking[keyof PartTracking]]>) {
    if (v !== undefined && v !== '') (out as Record<string, unknown>)[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

function mapSlot(build: Build, category: PartCategory, fn: (slot: ComponentSlot) => ComponentSlot): Build {
  return { ...build, components: build.components.map((s) => (s.category === category ? fn(s) : s)) }
}

/** Merge `patch` into a slot's tracking. Pass `undefined` values to clear fields; `null` patch clears all. */
export function withTracking(build: Build, category: PartCategory, patch: Partial<PartTracking> | null): Build {
  return mapSlot(build, category, (slot) => {
    const { tracking: _t, ...rest } = slot
    const tracking = patch === null ? undefined : compactTracking({ ...slot.tracking, ...patch })
    return tracking ? { ...rest, tracking } : rest
  })
}

export function withOdometer(build: Build, odometerKm: number | undefined): Build {
  const { odometerKm: _o, ...rest } = build
  return odometerKm == null || Number.isNaN(odometerKm) ? rest : { ...rest, odometerKm: Math.max(0, odometerKm) }
}

export function withStage(build: Build, stage: BuildStage | undefined): Build {
  const { stage: _s, ...rest } = build
  return stage ? { ...rest, stage } : rest
}

const byDateDesc = (a: ServiceEntry, b: ServiceEntry) => b.date.localeCompare(a.date) || (b.odometerKm ?? 0) - (a.odometerKm ?? 0)

/** Add a service entry (newest first). Bumps the odometer if the entry's reading is higher. */
export function withServiceEntry(build: Build, entry: Omit<ServiceEntry, 'id'> & { id?: string }): Build {
  const e: ServiceEntry = { ...entry, id: entry.id ?? crypto.randomUUID() }
  const log = [...(build.serviceLog ?? []).filter((x) => x.id !== e.id), e].sort(byDateDesc)
  const next = { ...build, serviceLog: log }
  return e.odometerKm != null && e.odometerKm > (build.odometerKm ?? 0) ? withOdometer(next, e.odometerKm) : next
}

export function withoutServiceEntry(build: Build, id: string): Build {
  return { ...build, serviceLog: (build.serviceLog ?? []).filter((e) => e.id !== id) }
}

/** Most recent service entry touching `category` (or whole-bike entries if `includeWholeBike`). */
export function lastServiceFor(build: Build, category: PartCategory, includeWholeBike = false): ServiceEntry | undefined {
  return (build.serviceLog ?? []).find((e) => (e.categories?.length ? e.categories.includes(category) : includeWholeBike))
}

/**
 * Distance on a part: odometer now − odometer when it went on (or when it was last
 * *replaced* per the service log, whichever is later). undefined if unknown.
 */
export function kmOnPart(build: Build, slot: ComponentSlot): number | undefined {
  if (build.odometerKm == null) return undefined
  const replaced = (build.serviceLog ?? []).find((e) => e.kind === 'replaced' && e.categories?.includes(slot.category) && e.odometerKm != null)
  const from = Math.max(slot.tracking?.installedAtKm ?? -1, replaced?.odometerKm ?? -1)
  return from < 0 ? undefined : Math.max(0, build.odometerKm - from)
}
