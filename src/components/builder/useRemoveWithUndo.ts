import type { ComponentSlot } from '@/types/build'
import { useBuildStore } from '@/store/buildStore'
import { useToast } from '@/hooks/useToast'

/** Removes a slot's part and offers an Undo toast that restores part, quantity, status and tracking. */
export function useRemoveWithUndo() {
  const removePart = useBuildStore((s) => s.removePart)
  const restoreSlot = useBuildStore((s) => s.restoreSlot)
  const { success } = useToast()

  return (slot: ComponentSlot) => {
    removePart(slot.category)
    success('Part removed', slot.part ? { label: 'Undo', onClick: () => restoreSlot(slot) } : undefined)
  }
}
