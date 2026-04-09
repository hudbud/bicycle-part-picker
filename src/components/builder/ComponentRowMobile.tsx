import type { ComponentSlot } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useBuildStore } from '@/store/buildStore'
import { useToast } from '@/hooks/useToast'
import { Frame, Button } from 'react95'
import styled from 'styled-components'

const RowFrame = styled(Frame).attrs({ variant: 'button' })`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  width: 100%;
  cursor: pointer;
  margin-bottom: 4px;
`

interface ComponentRowMobileProps {
  slot: ComponentSlot
  label: string
  onClickRow: (category: PartCategory) => void
}

export function ComponentRowMobile({ slot, label, onClickRow }: ComponentRowMobileProps) {
  const { removePart } = useBuildStore()
  const { success } = useToast()

  return (
    <RowFrame onClick={() => onClickRow(slot.category)}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
          {slot.part?.price && (
            <span style={{ fontSize: 13, fontWeight: 700 }}>${slot.part.price.toLocaleString()}</span>
          )}
        </div>
        {slot.part ? (
          <div style={{ marginTop: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{slot.part.brand} {slot.part.name}</span>
            {slot.status && <div style={{ marginTop: 4 }}><StatusBadge status={slot.status} /></div>}
          </div>
        ) : (
          <span style={{ fontSize: 12, fontStyle: 'italic' }}>Tap to choose a part…</span>
        )}
      </div>
      {slot.part && (
        <Button
          variant="flat"
          square
          onClick={(e) => {
            e.stopPropagation()
            removePart(slot.category)
            success('Part removed')
          }}
          aria-label={`Remove ${slot.part.name}`}
          style={{ fontSize: 11, flexShrink: 0 }}
        >
          ✕
        </Button>
      )}
    </RowFrame>
  )
}
