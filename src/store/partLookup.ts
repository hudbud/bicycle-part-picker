import type { PartCategory } from '@/types/parts'
import { useBuildStore } from './buildStore'
import { useGarageStore } from './garageStore'

export interface PartLocation {
  bikeId?: string
  bikeName: string
  /** true = the unsaved builder copy rather than a garage bike. */
  current: boolean
  category: PartCategory
}

/** Bikes (saved garage bikes, plus the builder if it's unsaved) that have `partId` installed. */
export function findPartOnBikes(partId: string): PartLocation[] {
  const out: PartLocation[] = []
  for (const b of useGarageStore.getState().builds) {
    for (const s of b.components) if (s.part?.id === partId) out.push({ bikeId: b.id, bikeName: b.name, current: false, category: s.category })
  }
  const cur = useBuildStore.getState().build
  if (!cur.id || !useGarageStore.getState().getBuildById(cur.id)) {
    for (const s of cur.components) if (s.part?.id === partId) out.push({ bikeName: cur.name, current: true, category: s.category })
  }
  return out
}
