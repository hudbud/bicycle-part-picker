import { useState } from 'react'
import type { ComponentSlot } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import type { PartStatus } from '@/types/build'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Popover } from '@/components/ui/Popover'
import { useBuildStore } from '@/store/buildStore'
import { useToast } from '@/hooks/useToast'
import { TableRow, TableDataCell, Button, MenuListItem } from 'react95'

interface ComponentRowProps {
  slot: ComponentSlot
  label: string
  onClickRow: (category: PartCategory) => void
  isSubRow?: boolean
  onToggleExpand?: () => void
  expanded?: boolean
}

const STATUSES: PartStatus[] = ['owned', 'purchased', 'partsbin', 'wanted']

export function ComponentRow({ slot, label, onClickRow, isSubRow, onToggleExpand, expanded }: ComponentRowProps) {
  const { removePart, setPart, setPartStatus, clearPartStatus } = useBuildStore()
  const { success } = useToast()
  const [statusOpen, setStatusOpen] = useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    const { part, status } = slot
    removePart(slot.category)
    success('Part removed', part ? {
      label: 'Undo',
      onClick: () => {
        setPart(slot.category, part)
        if (status) setPartStatus(slot.category, status)
      },
    } : undefined)
  }

  const handleStatusChange = (status: PartStatus) => {
    setPartStatus(slot.category, status)
    setStatusOpen(false)
  }

  return (
    <TableRow
      onClick={() => onClickRow(slot.category)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClickRow(slot.category) }
      }}
      tabIndex={0}
      role="button"
      aria-label={slot.part ? `${label}: ${slot.part.brand} ${slot.part.name}, change part` : `${label}: choose a part`}
      style={{ cursor: 'pointer' }}
    >
      <TableDataCell style={{ width: 140, fontSize: 12, fontWeight: 500, paddingLeft: isSubRow ? 20 : undefined }}>
        {isSubRow && <span style={{ marginRight: 4, opacity: 0.5 }}>└</span>}
        {label}
      </TableDataCell>

      <TableDataCell>
        {slot.part ? (
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {slot.part.brand} {slot.part.name}
            {slot.part.isCustom && <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 6 }}>(custom)</span>}
          </span>
        ) : (
          <span style={{ fontSize: 12, fontStyle: 'italic' }}>Choose a part…</span>
        )}
      </TableDataCell>

      <TableDataCell style={{ width: 90, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>
        {slot.part?.price ? `$${slot.part.price.toLocaleString()}` : '—'}
      </TableDataCell>

      <TableDataCell style={{ width: 120 }} onClick={(e) => e.stopPropagation()}>
        {slot.part && (
          <Popover
            open={statusOpen}
            onClose={() => setStatusOpen(false)}
            trigger={
              <button
                onClick={(e) => { e.stopPropagation(); setStatusOpen(!statusOpen) }}
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
                  onClick={(e) => { e.stopPropagation(); clearPartStatus(slot.category); setStatusOpen(false) }}
                  size="sm"
                  style={{ borderTop: '1px solid #888' }}
                >
                  Clear status
                </MenuListItem>
              )}
            </>
          </Popover>
        )}
      </TableDataCell>

      <TableDataCell style={{ width: 80, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {onToggleExpand && (
            <Button
              variant="flat"
              onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
              square
              style={{ fontSize: 10 }}
              title={expanded ? 'Collapse into Wheelset' : 'Split into hub, rim & spokes'}
              aria-label={expanded ? 'Collapse into single Wheelset row' : 'Split Wheelset into hub, rim & spokes'}
            >
              {expanded ? '▲' : '▼'}
            </Button>
          )}
          {slot.part ? (
            <Button
              variant="flat"
              onClick={handleRemove}
              aria-label={`Remove ${slot.part.name}`}
              square
              style={{ fontSize: 11 }}
            >
              ✕
            </Button>
          ) : (
            <Button
              variant="flat"
              onClick={(e) => { e.stopPropagation(); onClickRow(slot.category) }}
              aria-label={`Add ${label}`}
              square
              style={{ fontSize: 14 }}
            >
              +
            </Button>
          )}
        </div>
      </TableDataCell>
    </TableRow>
  )
}
