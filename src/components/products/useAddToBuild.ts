import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Part, PartCategory } from '@/types/parts'
import { useBuildStore } from '@/store/buildStore'
import { useCustomPartsStore } from '@/store/customPartsStore'
import { getPartById } from '@/data/partsDatabase'
import { getCategoryLabel } from '@/data/categoryConfig'
import { useToast } from '@/hooks/useToast'

const WHEEL_SUB: PartCategory[] = ['frontWheel', 'rearWheel', 'hub', 'rim', 'spokes']

/**
 * Put a part in a builder slot. The builder only has a "Wheelset" row *or* the split
 * wheel rows, so adding to a slot that isn't currently shown switches the wheel mode first.
 */
export function addPartToBuild(slot: PartCategory, part: Part) {
  const store = useBuildStore.getState()
  const hasSlot = store.build.components.some((s) => s.category === slot)
  if (!hasSlot) {
    const expanded = !!store.build.wheelsExpanded
    if ((WHEEL_SUB.includes(slot) && !expanded) || (slot === 'wheels' && expanded)) store.toggleWheelsExpanded()
  }
  useBuildStore.getState().setPart(slot, part)
}

/** Add → toast → go to the builder, like PCPartPicker. */
export function useAddToBuild() {
  const navigate = useNavigate()
  const { success } = useToast()
  return useCallback(
    (slot: PartCategory, part: Part) => {
      addPartToBuild(slot, part)
      success(`Added ${part.brand} ${part.name} as your ${getCategoryLabel(slot) ?? 'part'}`)
      navigate('/build')
    },
    [navigate, success],
  )
}

/** Id of the part currently in a slot, for "In build" states. */
export function useSlotPartId(slot: PartCategory): string | undefined {
  return useBuildStore((s) => s.build.components.find((c) => c.category === slot)?.part?.id)
}

/** Catalog part or one of the user's custom parts. */
export function useFindPart() {
  const custom = useCustomPartsStore((s) => s.parts)
  return useCallback((id: string) => getPartById(id) ?? custom.find((p) => p.id === id), [custom])
}
