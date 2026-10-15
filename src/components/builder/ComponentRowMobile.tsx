import { useNavigate } from 'react-router-dom'
import type { PartCategory } from '@/types/parts'
import { Frame, Button } from 'react95'
import styled from 'styled-components'
import { formatWeight } from '@/data/specSchema'
import { productsPath } from '@/data/categoryConfig'
import { RouterAnchor, TextButton, SelectionLabel, RowCompatIcon, MarketInfo } from '@/components/build/BuildCells'
import { choosePath, isMultiQuantity, partTitle, type SlotRow } from '@/components/build/buildRows'
import { PaidValue, ConditionSource } from '@/components/tracking/TrackingCells'
import { StatusPicker } from './StatusPicker'
import { QtyStepper } from './QtyStepper'
import { useRemoveWithUndo } from './useRemoveWithUndo'
import { chooseLabel } from './ComponentRow'

const RowFrame = styled(Frame).attrs({ variant: 'field' })`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 7px 9px;
  width: 100%;
  font-size: 12px;
`

const Line = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
`

interface ComponentRowMobileProps {
  row: SlotRow
  onCustom: (category: PartCategory) => void
  onDetails: (category: PartCategory) => void
  onToggleExpand?: () => void
  /** Wheelset row when split: shows "Collapse" instead of "Split". */
  expanded?: boolean
  /** Hides this row while it's empty (it comes back from "Add a line"). */
  onHide?: () => void
}

/** Mobile builder card: label + status, part, paid · condition · source, then quiet market info. */
export function ComponentRowMobile({ row, onCustom, onDetails, onToggleExpand, expanded, onHide }: ComponentRowMobileProps) {
  const navigate = useNavigate()
  const removeWithUndo = useRemoveWithUndo()
  const { slot, part, label } = row
  const details = () => onDetails(row.category)

  return (
    <RowFrame style={row.isWheelSub ? { marginLeft: 12, width: 'calc(100% - 12px)' } : undefined}>
      <Line>
        <RouterAnchor to={productsPath(row.category)} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </RouterAnchor>
        {part && <StatusPicker slot={slot} />}
      </Line>

      {part ? (
        <>
          <div style={{ fontSize: 13 }}>
            <SelectionLabel row={row} quantityControl={isMultiQuantity(slot) ? <QtyStepper slot={slot} label={label} /> : undefined} />
          </div>
          <Line style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: '4px 10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11 }}>Paid</span> <PaidValue slot={slot} onEdit={details} />
            </span>
            <ConditionSource slot={slot} onEdit={details} />
          </Line>
          <Line>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0, flexWrap: 'wrap' }}>
              <MarketInfo row={row} inline />
              {row.weightG != null && <span style={{ fontSize: 11, color: 'var(--win-muted)' }}>{formatWeight(row.weightG)}</span>}
            </span>
          </Line>
          <Line>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TextButton onClick={details}>details</TextButton>
              <TextButton onClick={() => navigate(choosePath(row.category))}>change</TextButton>
              {row.isCustom && <TextButton onClick={() => onCustom(row.category)}>edit</TextButton>}
            </span>
            <Button
              variant="flat"
              square
              size="sm"
              onClick={() => removeWithUndo(slot)}
              aria-label={`Remove ${partTitle(part)}`}
              style={{ fontSize: 11, flexShrink: 0 }}
            >
              ✕
            </Button>
          </Line>
        </>
      ) : !expanded && (
        <Line>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RowCompatIcon row={row} />
            <Button size="sm" onClick={() => navigate(choosePath(row.category))} style={{ fontSize: 12, height: 26 }}>
              + {chooseLabel(label)}
            </Button>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TextButton onClick={() => onCustom(row.category)} aria-label={`Add a custom ${label}`}>custom…</TextButton>
            {onHide && <TextButton onClick={onHide} aria-label={`Hide the ${label} row`}>hide</TextButton>}
          </span>
        </Line>
      )}

      {onToggleExpand && (
        <div>
          <TextButton onClick={onToggleExpand}>
            {expanded ? '▲ Join back into one Wheelset' : '▼ Split into wheels, hubs, rims & spokes'}
          </TextButton>
        </div>
      )}
    </RowFrame>
  )
}
