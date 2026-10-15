import { useMemo, useState } from 'react'
import { Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell, Frame } from 'react95'
import styled from 'styled-components'
import type { Build } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import type { BikeRef } from '@/store/bikeSync'
import { useSettingsStore } from '@/store/settingsStore'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { computeCompat } from '@/hooks/useCompat'
import { kmOnPart } from '@/utils/bikeOps'
import { formatDistance } from '@/utils/distance'
import { productsPath } from '@/data/categoryConfig'
import { getSlotRows, type SlotRow } from '@/components/build/buildRows'
import { MarketInfo, RouterAnchor, SelectionLabel, TextButton } from '@/components/build/BuildCells'
import { StatusPicker } from '@/components/builder/StatusPicker'
import { ConditionBadge } from '@/components/tracking/ConditionBadge'
import { PaidValue, CellButton } from '@/components/tracking/TrackingCells'
import { PartTrackingDialog } from '@/components/tracking/PartTrackingDialog'

const small = { fontSize: 11 } as const
const num = { textAlign: 'right' as const, whiteSpace: 'nowrap' as const, fontVariantNumeric: 'tabular-nums' as const }
const grey = { color: 'var(--win-gray-text)' } as const

/** react95 cells use a 34px line-height; tighten so multi-line cells (notes) read as one row. */
const TightTable = styled(Table)`
  td { line-height: 1.3; padding-top: 5px; padding-bottom: 5px; }
`

const Card = styled(Frame).attrs({ variant: 'field' })`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  width: 100%;
  font-size: 12px;
`

const Kv = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 10px;
  font-size: 11px;
  & > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  & b { font-weight: 400; color: var(--win-muted); }
`

function Cell({ children, onEdit, title }: { children: React.ReactNode; onEdit: () => void; title: string }) {
  return <CellButton onClick={onEdit} title={title} style={{ fontSize: 11 }}>{children}</CellButton>
}

/**
 * The tracker's parts table for one bike: status, condition, paid, source, acquired,
 * distance on the part and serial — every cell opens the same details dialog.
 */
export function BikePartsTable({ build, bike }: { build: Build; bike: BikeRef }) {
  const isMobile = useIsMobile()
  const unit = useSettingsStore((s) => s.distanceUnit)
  const compat = useMemo(() => computeCompat(build), [build])
  const rows = useMemo(() => getSlotRows(build, compat, true), [build, compat])
  const [editing, setEditing] = useState<PartCategory | null>(null)

  const onPart = (row: SlotRow) => {
    const km = kmOnPart(build, row.slot)
    return km != null ? formatDistance(km, unit) : <span style={grey}>—</span>
  }

  const dialog = <PartTrackingDialog bike={bike} category={editing} onClose={() => setEditing(null)} />

  if (rows.length === 0) {
    return <p style={{ fontSize: 12, margin: 0 }}>No parts on this bike yet — open it in the Builder to pick some.</p>
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((row) => {
          const t = row.slot.tracking
          const edit = () => setEditing(row.category)
          return (
            <Card key={row.category}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <RouterAnchor to={productsPath(row.category)} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{row.label}</RouterAnchor>
                <StatusPicker slot={row.slot} bike={bike} />
              </div>
              <SelectionLabel row={row} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={small}>Paid</span> <PaidValue slot={row.slot} onEdit={edit} />
                <ConditionBadge condition={t?.condition} short />
                <TextButton onClick={edit} style={{ marginLeft: 'auto' }}>details</TextButton>
              </div>
              <Kv>
                <span><b>Source</b> {t?.source ?? '—'}</span>
                <span><b>Acquired</b> {t?.acquiredAt ?? '—'}</span>
                <span><b>On part</b> {onPart(row)}</span>
                <span><b>Serial</b> {t?.serial ?? '—'}</span>
              </Kv>
              {t?.notes && <div style={{ ...small, color: 'var(--win-muted)' }}>{t.notes}</div>}
              <MarketInfo row={row} inline />
            </Card>
          )
        })}
        {dialog}
      </div>
    )
  }

  return (
    <>
      <TightTable style={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            <TableHeadCell style={{ width: 110 }}>Component</TableHeadCell>
            <TableHeadCell>Part</TableHeadCell>
            <TableHeadCell style={{ width: 100 }}>Status</TableHeadCell>
            <TableHeadCell style={{ width: 88 }}>Condition</TableHeadCell>
            <TableHeadCell style={{ width: 72, ...num }}>Paid</TableHeadCell>
            <TableHeadCell style={{ width: 104 }}>Source</TableHeadCell>
            <TableHeadCell style={{ width: 84 }}>Acquired</TableHeadCell>
            <TableHeadCell style={{ width: 76, ...num }} title="Distance since installed / last replaced">On part</TableHeadCell>
            <TableHeadCell style={{ width: 112 }}>Serial</TableHeadCell>
            <TableHeadCell style={{ width: 44 }}></TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const t = row.slot.tracking
            const edit = () => setEditing(row.category)
            return (
              <TableRow key={row.category}>
                <TableDataCell style={{ fontSize: 12, paddingLeft: row.isWheelSub ? 20 : undefined }}>
                  {row.isWheelSub && <span style={{ marginRight: 4, opacity: 0.5 }}>└</span>}
                  <RouterAnchor to={productsPath(row.category)}>{row.label}</RouterAnchor>
                </TableDataCell>
                <TableDataCell style={{ fontSize: 12 }}>
                  <SelectionLabel row={row} />
                  {t?.notes && (
                    <div style={{ fontSize: 11, color: 'var(--win-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }} title={t.notes}>
                      {t.notes}
                    </div>
                  )}
                </TableDataCell>
                <TableDataCell><StatusPicker slot={row.slot} bike={bike} /></TableDataCell>
                <TableDataCell>
                  <Cell onEdit={edit} title="Edit condition">
                    {t?.condition ? <ConditionBadge condition={t.condition} short /> : <span style={grey}>—</span>}
                  </Cell>
                </TableDataCell>
                <TableDataCell style={num}><PaidValue slot={row.slot} onEdit={edit} /></TableDataCell>
                <TableDataCell style={{ maxWidth: 104, overflow: 'hidden' }}>
                  <Cell onEdit={edit} title={t?.source ?? 'Edit source'}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.source ?? <span style={grey}>—</span>}</span>
                  </Cell>
                </TableDataCell>
                <TableDataCell style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                  <Cell onEdit={edit} title="Edit acquired date">{t?.acquiredAt ?? <span style={grey}>—</span>}</Cell>
                </TableDataCell>
                <TableDataCell style={{ fontSize: 11, ...num }}>{onPart(row)}</TableDataCell>
                <TableDataCell style={{ maxWidth: 112, overflow: 'hidden' }}>
                  <Cell onEdit={edit} title={t?.serial ?? 'Edit serial'}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: t?.serial ? 'monospace' : undefined }}>
                      {t?.serial ?? <span style={grey}>—</span>}
                    </span>
                  </Cell>
                </TableDataCell>
                <TableDataCell style={{ textAlign: 'right' }}>
                  <TextButton onClick={edit} aria-label={`Edit ${row.label} details`}>edit</TextButton>
                </TableDataCell>
              </TableRow>
            )
          })}
        </TableBody>
      </TightTable>
      {dialog}
    </>
  )
}
