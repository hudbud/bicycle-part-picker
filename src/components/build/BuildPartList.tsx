import { useMemo } from 'react'
import { Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell, Frame } from 'react95'
import styled from 'styled-components'
import type { Build } from '@/types/build'
import { computeCompat } from '@/hooks/useCompat'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { formatWeight } from '@/data/specSchema'
import { formatPrice } from '@/utils/format'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CompatBanner } from './CompatBanner'
import { BuildIssues } from './BuildIssues'
import { BuildTotals } from './BuildTotals'
import { BuyButton, RouterAnchor, SelectionLabel } from './BuildCells'
import { getSlotRows, type SlotRow } from './buildRows'
import { productsPath } from '@/data/categoryConfig'

/**
 * Read-only PCPartPicker-style part list for any Build: compatibility banner with
 * estimated weight, a Component | Selection | Weight | Price | Where | Buy table,
 * extras, totals and the Potential Issues / Notes lists. All prices, retailers,
 * weights and compatibility are computed live from the catalog.
 *
 * Used by the shared-build page; meant for Build Guides and Completed Builds too.
 *
 * ```tsx
 * <BuildPartList build={guide.build} />
 * <BuildPartList build={sharedBuild} showStatus />
 * ```
 */
export interface BuildPartListProps {
  build: Build
  /** Show the owner's Owned / Purchased / Wanted status column. Default false. */
  showStatus?: boolean
  /** Also list empty slots as "—" rows. Default false (selected parts only). */
  showEmptySlots?: boolean
}

const Num = { textAlign: 'right' as const, whiteSpace: 'nowrap' as const, fontVariantNumeric: 'tabular-nums' as const }

const SectionRow = styled(TableRow)`
  background: var(--win-stripe);
  td { font-size: 11px; font-weight: 700; padding: 4px 8px; }
`

const Card = styled(Frame).attrs({ variant: 'field' })`
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px;
  width: 100%;
  font-size: 12px;
`

function DesktopTable({ rows, build, showStatus }: { rows: SlotRow[]; build: Build; showStatus: boolean }) {
  const extras = build.additionalItems ?? []
  const cols = showStatus ? 7 : 6
  return (
    <Table style={{ width: '100%' }}>
      <TableHead>
        <TableRow>
          <TableHeadCell style={{ width: 130 }}>Component</TableHeadCell>
          <TableHeadCell>Selection</TableHeadCell>
          <TableHeadCell style={{ width: 80, ...Num }}>Weight</TableHeadCell>
          <TableHeadCell style={{ width: 90, ...Num }}>Price</TableHeadCell>
          <TableHeadCell style={{ width: 140 }}>Where</TableHeadCell>
          <TableHeadCell style={{ width: 56 }}></TableHeadCell>
          {showStatus && <TableHeadCell style={{ width: 110 }}>Status</TableHeadCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.category}>
            <TableDataCell style={{ fontSize: 12, paddingLeft: row.isWheelSub ? 20 : undefined }}>
              {row.isWheelSub && <span style={{ marginRight: 4, opacity: 0.5 }}>└</span>}
              <RouterAnchor to={productsPath(row.category)}>{row.label}</RouterAnchor>
            </TableDataCell>
            <TableDataCell style={{ fontSize: 13 }}>
              {row.part ? <SelectionLabel row={row} /> : <span style={{ color: 'var(--win-gray-text)' }}>—</span>}
            </TableDataCell>
            <TableDataCell style={{ fontSize: 12, ...Num }}>{row.part ? formatWeight(row.weightG) : ''}</TableDataCell>
            <TableDataCell style={{ fontSize: 13, fontWeight: 700, ...Num }}>{row.part ? formatPrice(row.price) : ''}</TableDataCell>
            <TableDataCell style={{ fontSize: 12 }}>{row.offer?.merchant.name ?? ''}</TableDataCell>
            <TableDataCell><BuyButton row={row} /></TableDataCell>
            {showStatus && <TableDataCell>{row.slot.status && <StatusBadge status={row.slot.status} />}</TableDataCell>}
          </TableRow>
        ))}
        {extras.length > 0 && (
          <>
            <SectionRow><td colSpan={cols}>Extras &amp; Accessories</td></SectionRow>
            {extras.map((item) => (
              <TableRow key={item.id}>
                <TableDataCell style={{ fontSize: 12 }}>Extra</TableDataCell>
                <TableDataCell style={{ fontSize: 12 }}>
                  {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--win-link)' }}>{item.name}</a> : item.name}
                  {item.notes && <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 8 }}>{item.notes}</span>}
                </TableDataCell>
                <TableDataCell />
                <TableDataCell style={{ fontSize: 13, fontWeight: 700, ...Num }}>{formatPrice(item.price)}</TableDataCell>
                <td colSpan={cols - 4} />
              </TableRow>
            ))}
          </>
        )}
      </TableBody>
    </Table>
  )
}

function MobileList({ rows, build, showStatus }: { rows: SlotRow[]; build: Build; showStatus: boolean }) {
  const extras = build.additionalItems ?? []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows.map((row) => (
        <Card key={row.category}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <RouterAnchor to={productsPath(row.category)} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{row.label}</RouterAnchor>
            {row.part && <strong style={{ fontSize: 13 }}>{formatPrice(row.price)}</strong>}
          </div>
          {row.part ? <SelectionLabel row={row} /> : <span style={{ color: 'var(--win-gray-text)' }}>—</span>}
          {row.part && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 11 }}>
              <span>
                {[row.weightG != null ? formatWeight(row.weightG) : null, row.offer?.merchant.name].filter(Boolean).join(' · ')}
              </span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {showStatus && row.slot.status && <StatusBadge status={row.slot.status} />}
                <BuyButton row={row} />
              </span>
            </div>
          )}
        </Card>
      ))}
      {extras.map((item) => (
        <Card key={item.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Extra</span>
            <strong style={{ fontSize: 13 }}>{formatPrice(item.price)}</strong>
          </div>
          <span>{item.name}{item.notes && <span style={{ opacity: 0.7 }}> — {item.notes}</span>}</span>
        </Card>
      ))}
    </div>
  )
}

export function BuildPartList({ build, showStatus = false, showEmptySlots = false }: BuildPartListProps) {
  const isMobile = useIsMobile()
  const compat = useMemo(() => computeCompat(build), [build])
  const rows = useMemo(() => getSlotRows(build, compat, !showEmptySlots), [build, compat, showEmptySlots])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CompatBanner build={build} compat={compat} />
      {isMobile
        ? <MobileList rows={rows} build={build} showStatus={showStatus} />
        : <DesktopTable rows={rows} build={build} showStatus={showStatus} />}
      <BuildTotals build={build} />
      <BuildIssues compat={compat} />
    </div>
  )
}
