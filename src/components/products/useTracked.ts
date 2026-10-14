import { useMemo } from 'react'
import { usePartsBinStore, type BinItem } from '@/store/partsBinStore'
import { useGarageStore } from '@/store/garageStore'
import { useBuildStore } from '@/store/buildStore'
import { findPartOnBikes, type PartLocation } from '@/store/partLookup'
import type { PartStatus, PartTracking } from '@/types/build'

/**
 * Ids of every catalog part you track — in the parts bin (any status but 'wanted') or on a
 * bike (garage or builder). For "✓ Have" markers in catalog lists.
 */
export function useHavePartIds(): Set<string> {
  const items = usePartsBinStore((s) => s.items)
  const garage = useGarageStore((s) => s.builds)
  const current = useBuildStore((s) => s.build)
  return useMemo(() => {
    const ids = new Set<string>()
    for (const i of items) if (i.status !== 'wanted') ids.add(i.part.id)
    for (const b of [...garage, current]) for (const s of b.components) if (s.part && s.status && s.status !== 'wanted') ids.add(s.part.id)
    return ids
  }, [items, garage, current])
}

export interface BikeWhereabout extends PartLocation {
  /** The slot's status on that bike (unset = planned). */
  status?: PartStatus
  tracking?: PartTracking
}

export interface PartWhereabouts {
  bikes: BikeWhereabout[]
  bin: BinItem[]
}

/** Where a part is: which bikes it's on and any parts-bin entries for it. Re-renders on store changes. */
export function usePartWhereabouts(partId: string): PartWhereabouts {
  const items = usePartsBinStore((s) => s.items)
  const garage = useGarageStore((s) => s.builds)
  const current = useBuildStore((s) => s.build)
  return useMemo(
    () => {
      const bikes = findPartOnBikes(partId).map((loc): BikeWhereabout => {
        const bike = loc.current ? current : garage.find((b) => b.id === loc.bikeId)
        const slot = bike?.components.find((s) => s.category === loc.category && s.part?.id === partId)
        return { ...loc, status: slot?.status, tracking: slot?.tracking }
      })
      return { bikes, bin: items.filter((i) => i.part.id === partId) }
    },
    // findPartOnBikes reads the stores directly; these deps make it recompute when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [partId, items, garage, current],
  )
}
