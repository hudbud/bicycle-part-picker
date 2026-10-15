import { useNavigate } from 'react-router-dom'
import type { PartCategory } from '@/types/parts'
import { TableRow, TableDataCell, Button } from 'react95'
import { formatWeight } from '@/data/specSchema'
import { productsPath } from '@/data/categoryConfig'
import { RouterAnchor, TextButton, SelectionLabel, RowCompatIcon, MarketInfo } from '@/components/build/BuildCells'
import { choosePath, isMultiQuantity, partTitle, type SlotRow } from '@/components/build/buildRows'
import { PaidValue, ConditionSource } from '@/components/tracking/TrackingCells'
import { StatusPicker } from './StatusPicker'
import { QtyStepper } from './QtyStepper'
import { useRemoveWithUndo } from './useRemoveWithUndo'

/** Builder column widths, shared by the header, part rows and extras rows. */
export const COLS = {
  component: 118,
  status: 104,
  paid: 76,
  condition: 150,
  weight: 64,
  market: 132,
  actions: 52,
} as const
export const COL_COUNT = 8

/** "Choose A Frame" / "Choose Tires" — plural labels read badly with "A". */
export function chooseLabel(label: string): string {
  return label.endsWith('s') ? `Choose ${label}` : `Choose A ${label}`
}

const num = { textAlign: 'right' as const, whiteSpace: 'nowrap' as const, fontVariantNumeric: 'tabular-nums' as const }

interface ComponentRowProps {
  row: SlotRow
  /** Opens the freeform PartSelectionModal for this slot. */
  onCustom: (category: PartCategory) => void
  /** Opens the tracking details dialog for this slot. */
  onDetails: (category: PartCategory) => void
  onToggleExpand?: () => void
  /** Hides this row while it's empty (it comes back from "Add a line"). */
  onHide?: () => void
}

/**
 * One builder row, tracker-first: Component | Selection | Status | Paid | Condition / Source |
 * Weight | Market (quiet: best price, where, buy) | actions.
 */
export function ComponentRow({ row, onCustom, onDetails, onToggleExpand, onHide }: ComponentRowProps) {
  const navigate = useNavigate()
  const removeWithUndo = useRemoveWithUndo()
  const { slot, part, label } = row
  const details = () => onDetails(row.category)

  return (
    <TableRow>
      <TableDataCell style={{ width: COLS.component, fontSize: 12, paddingLeft: row.isWheelSub ? 20 : undefined }}>
        {row.isWheelSub && <span style={{ marginRight: 4, opacity: 0.5 }}>└</span>}
        <RouterAnchor to={productsPath(row.category)}>{label}</RouterAnchor>
      </TableDataCell>

      <TableDataCell style={{ fontSize: 13 }}>
        {part ? (
          <SelectionLabel
            row={row}
            quantityControl={isMultiQuantity(slot) ? <QtyStepper slot={slot} label={label} /> : undefined}
          >
            <span style={{ display: 'inline-flex', gap: 6 }}>
              <TextButton onClick={details} aria-label={`Details for ${label}`} title="Paid, source, condition, serial, notes, distance">details</TextButton>
              <TextButton onClick={() => navigate(choosePath(row.category))} aria-label={`Change ${label}`}>change</TextButton>
              {row.isCustom && <TextButton onClick={() => onCustom(row.category)} aria-label={`Edit custom ${label}`}>edit</TextButton>}
            </span>
          </SelectionLabel>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <RowCompatIcon row={row} />
            <Button
              size="sm"
              onClick={() => navigate(choosePath(row.category))}
              style={{ fontSize: 12, height: 24, padding: '0 10px' }}
            >
              + {chooseLabel(label)}
            </Button>
            <TextButton onClick={() => onCustom(row.category)} title="Enter any part by hand" aria-label={`Add a custom ${label}`}>
              custom…
            </TextButton>
            {onHide && <TextButton onClick={onHide} title="Hide this row. Add it back from “Add a line”." aria-label={`Hide the ${label} row`}>hide</TextButton>}
          </span>
        )}
      </TableDataCell>

      <TableDataCell style={{ width: COLS.status }}>
        {part && <StatusPicker slot={slot} />}
      </TableDataCell>

      <TableDataCell style={{ width: COLS.paid, ...num }}>
        <PaidValue slot={slot} onEdit={details} />
      </TableDataCell>

      <TableDataCell style={{ width: COLS.condition, maxWidth: COLS.condition }}>
        <ConditionSource slot={slot} onEdit={details} />
      </TableDataCell>

      <TableDataCell style={{ width: COLS.weight, fontSize: 12, ...num }}>
        {part ? formatWeight(row.weightG) : ''}
      </TableDataCell>

      <TableDataCell style={{ width: COLS.market, maxWidth: COLS.market }}>
        <MarketInfo row={row} />
      </TableDataCell>

      <TableDataCell style={{ width: COLS.actions, textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {onToggleExpand && (
            <Button
              variant="flat"
              onClick={onToggleExpand}
              square
              size="sm"
              style={{ fontSize: 10 }}
              title="Split into front/rear wheels, hubs, rims & spokes"
              aria-label="Split Wheelset into front/rear wheels, hubs, rims & spokes"
            >
              ▼
            </Button>
          )}
          {part && (
            <Button
              variant="flat"
              onClick={() => removeWithUndo(slot)}
              aria-label={`Remove ${partTitle(part)}`}
              title="Remove"
              square
              size="sm"
              style={{ fontSize: 11 }}
            >
              ✕
            </Button>
          )}
        </div>
      </TableDataCell>
    </TableRow>
  )
}
