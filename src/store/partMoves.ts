import type { PartCategory } from '@/types/parts'
import type { ComponentSlot } from '@/types/build'
import { defaultQuantity } from '@/data/categoryConfig'
import { usePartsBinStore } from './partsBinStore'
import { getBike, updateBike, type BikeRef } from './bikeSync'

/** Take the part off a bike and put it in the parts bin, keeping what you paid etc. */
export function uninstallToBin(ref: BikeRef, category: PartCategory): void {
  const slot = getBike(ref)?.components.find((s) => s.category === category)
  if (!slot?.part) return
  const { installedAtKm: _km, ...tracking } = slot.tracking ?? {}
  usePartsBinStore.getState().addItem(slot.part, 'owned', undefined, {
    quantity: slot.quantity,
    tracking: Object.keys(tracking).length ? tracking : undefined,
  })
  updateBike(ref, (b) => ({ ...b, components: b.components.map((s) => (s.category === category ? { category } : s)) }))
}

/**
 * Install a parts-bin item on a bike (status → owned, install odometer recorded). Whatever
 * was in that slot goes back to the bin. `category` defaults to the part's own category
 * (pass 'frontWheel' / 'rearWheel' etc. for split wheels).
 */
export function installFromBin(itemId: string, ref: BikeRef, category?: PartCategory): void {
  const bin = usePartsBinStore.getState()
  const item = bin.items.find((i) => i.id === itemId)
  const bike = getBike(ref)
  if (!item || !bike) return
  const cat = category ?? item.part.category
  if (bike.components.find((s) => s.category === cat)?.part) uninstallToBin(ref, cat)
  const odo = getBike(ref)?.odometerKm
  const tracking = { ...item.tracking, ...(odo != null ? { installedAtKm: odo } : {}) }
  const qty = item.quantity ?? defaultQuantity(cat)
  const slot: ComponentSlot = {
    category: cat,
    part: item.part,
    status: 'owned',
    ...(qty !== 1 ? { quantity: qty } : {}),
    ...(Object.keys(tracking).length ? { tracking } : {}),
  }
  updateBike(ref, (b) => ({
    ...b,
    components: b.components.some((s) => s.category === cat)
      ? b.components.map((s) => (s.category === cat ? slot : s))
      : [...b.components, slot],
  }))
  bin.removeItem(itemId)
}
