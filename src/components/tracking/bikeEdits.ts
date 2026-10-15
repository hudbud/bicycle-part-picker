import type { Build, PartStatus, PartTracking } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import { updateBike, type BikeRef } from '@/store/bikeSync'
import { useBuildStore } from '@/store/buildStore'
import { useGarageStore } from '@/store/garageStore'
import { withTracking } from '@/utils/bikeOps'

/**
 * Slot-level tracking edits for a bike (and its builder/garage twin via `updateBike`).
 * Each edit only lands on a copy whose slot still holds the same part — so if the builder's
 * working copy has swapped the saddle, the garage copy's old saddle isn't overwritten.
 */
function editSlot(ref: BikeRef, category: PartCategory, partId: string | undefined, fn: (b: Build) => Build) {
  if (!partId) return
  updateBike(ref, (b) => (b.components.find((s) => s.category === category)?.part?.id === partId ? fn(b) : b))
}

/** Replace a slot's tracking wholesale (`undefined` clears it). */
export function setSlotTracking(ref: BikeRef, category: PartCategory, partId: string | undefined, tracking: PartTracking | undefined) {
  editSlot(ref, category, partId, (b) => withTracking(withTracking(b, category, null), category, tracking ?? null))
}

/** Set or clear (`undefined` = planned / still to buy) a slot's status. */
export function setSlotStatus(ref: BikeRef, category: PartCategory, partId: string | undefined, status: PartStatus | undefined) {
  editSlot(ref, category, partId, (b) => ({
    ...b,
    components: b.components.map((s) => {
      if (s.category !== category) return s
      const { status: _s, ...rest } = s
      return status ? { ...rest, status } : rest
    }),
  }))
}

/** Live bike for a ref (re-renders on edits). */
export function useBike(ref: BikeRef): Build | undefined {
  const current = useBuildStore((s) => s.build)
  const garageId = ref.kind === 'garage' ? ref.id : undefined
  const saved = useGarageStore((s) => (garageId ? s.builds.find((b) => b.id === garageId) : undefined))
  return ref.kind === 'current' ? current : saved
}
