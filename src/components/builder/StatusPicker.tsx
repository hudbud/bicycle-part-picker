import { useState } from 'react'
import { MenuListItem } from 'react95'
import type { ComponentSlot, PartStatus } from '@/types/build'
import type { BikeRef } from '@/store/bikeSync'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Popover } from '@/components/ui/Popover'
import { setSlotStatus } from '@/components/tracking/bikeEdits'

const STATUSES: PartStatus[] = ['owned', 'purchased', 'partsbin', 'wanted']
const CURRENT: BikeRef = { kind: 'current' }

/**
 * Owned / Purchased / Parts bin / Wanted popover for a filled slot. No status = planned
 * (still to buy). Edits go through `updateBike`, so the garage twin stays in sync.
 */
export function StatusPicker({ slot, bike = CURRENT }: { slot: ComponentSlot; bike?: BikeRef }) {
  const [open, setOpen] = useState(false)
  const set = (s: PartStatus | undefined) => { setSlotStatus(bike, slot.category, slot.part?.id, s); setOpen(false) }

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <button
          onClick={() => setOpen(!open)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', lineHeight: 1.2, whiteSpace: 'nowrap', verticalAlign: 'middle' }}
          aria-haspopup="menu"
          aria-expanded={open}
          title="Set status"
        >
          {slot.status
            ? <StatusBadge status={slot.status} />
            : <span style={{ fontSize: 11, color: 'var(--win-muted)', border: '1px dashed var(--win-shadow)', padding: '0 5px' }}>Planned ▾</span>}
        </button>
      }
    >
      <>
        {STATUSES.map((s) => (
          <MenuListItem key={s} onClick={() => set(s)} size="sm">
            <StatusBadge status={s} />
          </MenuListItem>
        ))}
        {slot.status && (
          <MenuListItem onClick={() => set(undefined)} size="sm" style={{ borderTop: '1px solid var(--win-shadow)', fontSize: 12 }}>
            Planned (to buy)
          </MenuListItem>
        )}
      </>
    </Popover>
  )
}
