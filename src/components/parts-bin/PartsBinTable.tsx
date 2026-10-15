import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell, Button } from 'react95'
import { productPath } from '@/data/categoryConfig'
import { formatPrice } from '@/utils/format'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConditionBadge } from '@/components/tracking/ConditionBadge'
import { EraTag } from '@/components/products/ProductBits'
import { bikeHref, categoryName, marketValue, type InventoryRow } from './inventory'

export type SortKey = 'part' | 'category' | 'status' | 'paid' | 'acquired' | 'where'

export interface PartsBinTableProps {
  rows: InventoryRow[]
  sort: SortKey
  dir: 'asc' | 'desc'
  onSort: (k: SortKey) => void
  onEdit: (row: InventoryRow) => void
  onInstall: (row: InventoryRow & { kind: 'bin' }) => void
  onRemove: (row: InventoryRow & { kind: 'bin' }) => void
  onUninstall: (row: InventoryRow & { kind: 'bike' }) => void
  mobile?: boolean
}

const Scroll = styled.div`
  overflow-x: auto;
  width: 100%;
`

const T = styled(Table)`
  width: 100%;
  font-size: 12px;
  th {
    white-space: nowrap;
    font-size: 12px;
    height: 26px;
  }
  td {
    padding: 3px 6px;
    vertical-align: middle;
    line-height: 1.3;
  }
  tbody tr {
    height: 36px;
  }
  tbody tr:nth-child(even) {
    background: var(--win-stripe);
  }
  tbody tr:hover {
    background: var(--win-select-soft);
    color: var(--win-window-text);
  }
`

const SortHead = styled(TableHeadCell)<{ $active?: boolean }>`
  cursor: pointer;
  ${({ $active }) => ($active ? 'font-weight: 700;' : '')}
`

const A = styled(Link)`
  color: var(--win-link);
  text-decoration: underline;
`

const Muted = styled.span`
  color: var(--win-muted);
  font-size: 11px;
`

const Num = styled.span`
  font-variant-numeric: tabular-nums;
`

const Clip = styled.span`
  display: block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Where = styled.span<{ $bike?: boolean }>`
  display: inline-block;
  padding: 0 4px;
  font-size: 11px;
  line-height: 15px;
  white-space: nowrap;
  border: 1px solid ${({ $bike }) => ($bike ? 'var(--win-title-solid)' : 'var(--win-shadow)')};
  background: ${({ $bike }) => ($bike ? 'var(--win-window)' : 'var(--win-stripe)')};
`

const Actions = styled.div`
  display: flex;
  gap: 3px;
  justify-content: flex-end;
  button {
    font-size: 11px;
    height: 22px;
    padding: 0 6px;
    min-width: 0;
  }
`

function PartName({ row }: { row: InventoryRow }) {
  const p = row.part
  return (
    <span>
      {p.isCustom ? (
        <span>
          <strong style={{ fontWeight: 700 }}>{p.brand}</strong> {p.name}
        </span>
      ) : (
        <A to={productPath(p.id)}>
          <strong style={{ fontWeight: 700 }}>{p.brand}</strong> {p.name}
        </A>
      )}{' '}
      <EraTag part={p} />
    </span>
  )
}

function WhereCell({ row }: { row: InventoryRow }) {
  if (row.kind === 'bin') return <Where title="Loose in the parts bin">Parts bin</Where>
  return (
    <Where $bike title={`Installed on ${row.bike.name} as ${categoryName(row.category)}`}>
      <A to={bikeHref(row.ref)} style={{ color: 'var(--win-link)' }}>
        {row.bike.name || 'My Build'}
      </A>
    </Where>
  )
}

function notesOf(row: InventoryRow): string {
  const t = row.tracking
  return [t?.serial ? `S/N ${t.serial}` : '', t?.notes ?? row.notes ?? ''].filter(Boolean).join(' · ')
}

/** Paid, or for wishlist items the price to buy now. */
function PaidCell({ row }: { row: InventoryRow }) {
  if (row.status === 'wanted') {
    const v = marketValue(row.part, row.quantity)
    return v == null ? <Muted>—</Muted> : <Muted title="Best current price (to buy)">{formatPrice(v)} to buy</Muted>
  }
  const paid = row.tracking?.pricePaid
  return paid == null ? <Muted title="No price paid recorded">—</Muted> : <Num style={{ fontWeight: 700 }}>{formatPrice(paid)}</Num>
}

function RowActions({ row, onEdit, onInstall, onRemove, onUninstall }: Omit<PartsBinTableProps, 'rows' | 'sort' | 'dir' | 'onSort' | 'mobile'> & { row: InventoryRow }) {
  return (
    <Actions>
      <Button size="sm" onClick={() => onEdit(row)} aria-label={`Edit tracking for ${row.part.name}`}>
        Edit
      </Button>
      {row.kind === 'bin' ? (
        <>
          <Button size="sm" onClick={() => onInstall(row)} title="Install on one of your bikes">
            Install…
          </Button>
          <Button size="sm" onClick={() => onRemove(row)} aria-label={`Remove ${row.part.name}`} title="Remove from bin">
            ✕
          </Button>
        </>
      ) : (
        <Button size="sm" onClick={() => onUninstall(row)} title="Take it off the bike and put it in the bin">
          To bin
        </Button>
      )}
    </Actions>
  )
}

export function PartsBinTable(props: PartsBinTableProps) {
  const { rows, sort, dir, onSort, mobile } = props
  if (mobile) return <MobileList {...props} />

  const head = (key: SortKey, label: string, style?: React.CSSProperties) => {
    const active = sort === key
    return (
      <SortHead $active={active} onClick={() => onSort(key)} style={style} title={`Sort by ${label}`}>
        {label}
        <span style={{ marginLeft: 3, fontSize: 9, opacity: active ? 1 : 0.35 }}>{active ? (dir === 'asc' ? '▲' : '▼') : '▲▼'}</span>
      </SortHead>
    )
  }

  return (
    <Scroll>
      <T>
        <TableHead>
          <TableRow>
            {head('part', 'Part')}
            {head('category', 'Category')}
            {head('status', 'Status')}
            <TableHeadCell>Condition</TableHeadCell>
            {head('paid', 'Paid', { textAlign: 'right' })}
            <TableHeadCell>Source</TableHeadCell>
            {head('acquired', 'Acquired')}
            <TableHeadCell style={{ textAlign: 'right' }}>Qty</TableHeadCell>
            {head('where', 'Where it is')}
            <TableHeadCell>Notes / serial</TableHeadCell>
            <TableHeadCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const notes = notesOf(row)
            return (
              <TableRow key={row.key}>
                <TableDataCell style={{ minWidth: 200 }}>
                  <PartName row={row} />
                </TableDataCell>
                <TableDataCell style={{ whiteSpace: 'nowrap' }}>{categoryName(row.category)}</TableDataCell>
                <TableDataCell>
                  <StatusBadge status={row.status} />
                </TableDataCell>
                <TableDataCell>
                  {row.tracking?.condition ? <ConditionBadge condition={row.tracking.condition} short /> : <Muted>—</Muted>}
                </TableDataCell>
                <TableDataCell style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <PaidCell row={row} />
                </TableDataCell>
                <TableDataCell>
                  <Clip style={{ maxWidth: 110 }} title={row.tracking?.source}>
                    {row.tracking?.source || <Muted>—</Muted>}
                  </Clip>
                </TableDataCell>
                <TableDataCell style={{ whiteSpace: 'nowrap' }}>
                  <Num>{row.tracking?.acquiredAt || <Muted>—</Muted>}</Num>
                </TableDataCell>
                <TableDataCell style={{ textAlign: 'right' }}>
                  <Num>{row.quantity}</Num>
                </TableDataCell>
                <TableDataCell>
                  <WhereCell row={row} />
                </TableDataCell>
                <TableDataCell>
                  <Clip title={notes}>{notes || <Muted>—</Muted>}</Clip>
                </TableDataCell>
                <TableDataCell style={{ whiteSpace: 'nowrap' }}>
                  <RowActions row={row} {...props} />
                </TableDataCell>
              </TableRow>
            )
          })}
        </TableBody>
      </T>
    </Scroll>
  )
}

const Card = styled.div<{ $odd?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  font-size: 12px;
  background: ${({ $odd }) => ($odd ? 'var(--win-stripe)' : 'var(--win-window)')};
  color: var(--win-window-text);
  & + & {
    border-top: 1px solid var(--win-shadow);
  }
`

const Line = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
`

function MobileList(props: PartsBinTableProps) {
  return (
    <div style={{ background: 'var(--win-window)', color: 'var(--win-window-text)', border: '2px solid', borderColor: 'var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow)' }}>
      {props.rows.map((row, i) => {
        const notes = notesOf(row)
        const meta = [row.tracking?.source, row.tracking?.acquiredAt, row.quantity > 1 ? `×${row.quantity}` : ''].filter(Boolean).join(' · ')
        return (
          <Card key={row.key} $odd={i % 2 === 1}>
            <Line style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <PartName row={row} />
              <span style={{ whiteSpace: 'nowrap' }}>
                <PaidCell row={row} />
              </span>
            </Line>
            <Line>
              <Muted>{categoryName(row.category)}</Muted>
              <StatusBadge status={row.status} />
              <ConditionBadge condition={row.tracking?.condition} short />
              <WhereCell row={row} />
            </Line>
            <Line style={{ justifyContent: 'space-between', flexWrap: 'nowrap', alignItems: 'flex-end' }}>
              <Muted style={{ lineHeight: 1.35, minWidth: 0 }}>{[meta, notes].filter(Boolean).join(' · ')}</Muted>
              <RowActions row={row} {...props} />
            </Line>
          </Card>
        )
      })}
    </div>
  )
}
