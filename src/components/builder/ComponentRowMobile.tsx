import { useState } from 'react'
import type { ComponentSlot, PartStatus } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Popover } from '@/components/ui/Popover'
import { useBuildStore } from '@/store/buildStore'
import { useToast } from '@/hooks/useToast'
import { Frame, Button, MenuListItem } from 'react95'
import styled from 'styled-components'

const RowFrame = styled(Frame).attrs({ variant: 'button' })`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  width: 100%;
  margin-bottom: 4px;
`

const TopArea = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
`

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
`

const STATUSES: PartStatus[] = ['owned', 'purchased', 'partsbin', 'wanted']

interface ComponentRowMobileProps {
  slot: ComponentSlot
  label: string
  onClickRow: (category: PartCategory) => void
  onToggleExpand?: () => void
  expanded?: boolean
}

export function ComponentRowMobile({ slot, label, onClickRow, onToggleExpand, expanded }: ComponentRowMobileProps) {
  const { removePart, setPart, setPartStatus, clearPartStatus } = useBuildStore()
  const { success } = useToast()
  const [statusOpen, setStatusOpen] = useState(false)

  const handleStatusChange = (status: PartStatus) => {
    setPartStatus(slot.category, status)
    setStatusOpen(false)
  }

  return (
    <RowFrame>
      <TopArea onClick={() => onClickRow(slot.category)}>
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
            </div>
          ) : (
            <span style={{ fontSize: 12, fontStyle: 'italic' }}>Tap to add a part…</span>
          )}
        </div>
      </TopArea>

      {(slot.part || onToggleExpand) && (
        <ActionsRow>
          {slot.part ? (
            <Popover
              open={statusOpen}
              onClose={() => setStatusOpen(false)}
              trigger={
                <button
                  onClick={() => setStatusOpen(!statusOpen)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {slot.status
                    ? <StatusBadge status={slot.status} />
                    : <span style={{ fontSize: 11 }}>Set status▾</span>
                  }
                </button>
              }
            >
              <>
                {STATUSES.map((s) => (
                  <MenuListItem key={s} onClick={() => handleStatusChange(s)} size="sm">
                    <StatusBadge status={s} />
                  </MenuListItem>
                ))}
                {slot.status && (
                  <MenuListItem
                    onClick={() => { clearPartStatus(slot.category); setStatusOpen(false) }}
                    size="sm"
                    style={{ borderTop: '1px solid #888' }}
                  >
                    Clear status
                  </MenuListItem>
                )}
              </>
            </Popover>
          ) : <span />}

          <div style={{ display: 'flex', gap: 4 }}>
            {onToggleExpand && (
              <Button
                variant="flat"
                square
                onClick={onToggleExpand}
                style={{ fontSize: 10 }}
                title={expanded ? 'Collapse into Wheelset' : 'Split into hub, rim & spokes'}
              >
                {expanded ? '▲ Collapse' : '▼ Split wheel'}
              </Button>
            )}
            {slot.part && (
              <Button
                variant="flat"
                square
                onClick={() => {
                  const { part, status } = slot
                  removePart(slot.category)
                  success('Part removed', part ? {
                    label: 'Undo',
                    onClick: () => {
                      setPart(slot.category, part)
                      if (status) setPartStatus(slot.category, status)
                    },
                  } : undefined)
                }}
                aria-label={`Remove ${slot.part.name}`}
                style={{ fontSize: 11, flexShrink: 0 }}
              >
                ✕
              </Button>
            )}
          </div>
        </ActionsRow>
      )}
    </RowFrame>
  )
}
