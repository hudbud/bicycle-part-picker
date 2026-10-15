import styled from 'styled-components'
import { Checkbox, Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell } from 'react95'
import type { PartCategory } from '@/types/parts'
import { FieldInput, FieldSelect, parseNum } from '@/components/tracking/fields'
import { CATEGORY_CHOICES, CUSTOM, recategorize, type ReviewRow } from './reviewRows'

export interface ReviewTableProps {
  rows: ReviewRow[]
  onChange: (row: ReviewRow) => void
  /** Open the catalog search for this row. */
  onSearch: (row: ReviewRow) => void
  mobile?: boolean
}

const SEARCH = '__search'
const EXTRA = ''

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
    vertical-align: top;
    line-height: 1.3;
  }
  tbody tr:nth-child(even) {
    background: var(--win-stripe);
  }
  tbody tr:hover {
    background: var(--win-select-soft);
    color: var(--win-window-text);
  }
  tbody tr.off {
    color: var(--win-gray-text);
  }
`

const Muted = styled.span`
  color: var(--win-muted);
  font-size: 11px;
`

const Raw = styled.span`
  display: block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding-top: 4px;
`

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
`

const BADGE: Record<string, { label: string; bg: string; title: string }> = {
  high: { label: 'Match', bg: '#c8ecc8', title: 'Confident catalog match' },
  medium: { label: 'Check', bg: '#fff1a8', title: 'Probably right — worth a glance' },
  low: { label: 'Guess', bg: '#ffd6a8', title: 'Weak match — check it, or keep as custom' },
  none: { label: 'Custom', bg: '#e4e4e4', title: 'Not in the catalog — saved as a custom part' },
  extra: { label: 'Extra', bg: '#e4e4e4', title: 'Saved under additional items' },
}

const BadgeBox = styled.span<{ $bg: string }>`
  display: inline-block;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  white-space: nowrap;
  border: 1px solid #808080;
  background: ${({ $bg }) => $bg};
  color: #000;
`

function MatchBadge({ row }: { row: ReviewRow }) {
  const b = BADGE[!row.category ? 'extra' : row.choice === CUSTOM ? 'none' : row.confidence]
  return <BadgeBox $bg={b.bg} title={b.title}>{b.label}</BadgeBox>
}

function CategorySelect({ row, onChange }: { row: ReviewRow; onChange: ReviewTableProps['onChange'] }) {
  return (
    <FieldSelect
      aria-label="Category"
      value={row.category ?? EXTRA}
      disabled={!row.include}
      onChange={(e) => onChange(recategorize(row, (e.target.value || undefined) as PartCategory | undefined))}
      style={{ width: '100%' }}
    >
      {CATEGORY_CHOICES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      <option value={EXTRA}>Extra item</option>
    </FieldSelect>
  )
}

function PartPicker({ row, onChange, onSearch }: Omit<ReviewTableProps, 'rows' | 'mobile'> & { row: ReviewRow }) {
  const nameInput = (
    <FieldInput
      aria-label={row.category ? 'Custom part name' : 'Item name'}
      value={row.text}
      disabled={!row.include}
      onChange={(e) => onChange({ ...row, text: e.target.value })}
      style={{ width: '100%' }}
    />
  )
  if (!row.category) return nameInput
  return (
    <Stack>
      <FieldSelect
        aria-label="Matched part"
        value={row.choice}
        disabled={!row.include}
        onChange={(e) => {
          const v = e.target.value
          if (v === SEARCH) { onSearch(row); return }
          onChange({ ...row, choice: v, confidence: v === CUSTOM ? 'none' : 'high' })
        }}
        style={{ width: '100%' }}
      >
        {row.candidates.map((p) => (
          <option key={p.id} value={p.id}>{`${p.brand} ${p.name}`.trim()}</option>
        ))}
        <option value={CUSTOM}>Keep as custom: {row.text.length > 40 ? row.text.slice(0, 39) + '…' : row.text}</option>
        <option value={SEARCH}>Search catalog…</option>
      </FieldSelect>
      {row.choice === CUSTOM && nameInput}
    </Stack>
  )
}

function PaidInput({ row, onChange }: { row: ReviewRow; onChange: ReviewTableProps['onChange'] }) {
  return (
    <FieldInput
      type="number"
      inputMode="decimal"
      min={0}
      step="any"
      aria-label="Price paid"
      placeholder="$"
      value={row.pricePaid ?? ''}
      disabled={!row.include}
      onChange={(e) => onChange({ ...row, pricePaid: parseNum(e.target.value) })}
      style={{ width: 64, flex: 'none' }}
    />
  )
}

const Tick = styled.span`
  display: inline-flex;
  flex: none;
  label { margin: 0; }
`

const Include = ({ row, onChange }: { row: ReviewRow; onChange: ReviewTableProps['onChange'] }) => (
  <Tick title="Include on the bike">
    <Checkbox
      checked={row.include}
      onChange={(e) => onChange({ ...row, include: e.target.checked })}
      aria-label={`Include ${row.text}`}
    />
  </Tick>
)

const noteText = (row: ReviewRow) => [row.quantity && row.quantity > 1 ? `×${row.quantity}` : '', row.note].filter(Boolean).join(' · ')

export function ReviewTable(props: ReviewTableProps) {
  const { rows, onChange, mobile } = props
  if (mobile) return <MobileList {...props} />
  return (
    <Scroll>
      <T>
        <TableHead>
          <TableRow>
            <TableHeadCell style={{ width: 24 }} />
            <TableHeadCell>You pasted</TableHeadCell>
            <TableHeadCell style={{ width: 150 }}>Category</TableHeadCell>
            <TableHeadCell>Part</TableHeadCell>
            <TableHeadCell style={{ width: 60 }}>Match</TableHeadCell>
            <TableHeadCell style={{ width: 80 }}>Paid</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const note = noteText(row)
            return (
              <TableRow key={row.id} className={row.include ? undefined : 'off'}>
                <TableDataCell><Include row={row} onChange={onChange} /></TableDataCell>
                <TableDataCell style={{ maxWidth: 280 }}>
                  <Raw title={row.raw}>{row.raw}</Raw>
                  {note && <Muted title="Saved in the part's notes">Notes: {note}</Muted>}
                </TableDataCell>
                <TableDataCell><CategorySelect row={row} onChange={onChange} /></TableDataCell>
                <TableDataCell style={{ minWidth: 240 }}><PartPicker row={row} {...props} /></TableDataCell>
                <TableDataCell style={{ paddingTop: 6 }}><MatchBadge row={row} /></TableDataCell>
                <TableDataCell><PaidInput row={row} onChange={onChange} /></TableDataCell>
              </TableRow>
            )
          })}
        </TableBody>
      </T>
    </Scroll>
  )
}

const Card = styled.div<{ $odd?: boolean; $off?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px 8px;
  font-size: 12px;
  background: ${({ $odd }) => ($odd ? 'var(--win-stripe)' : 'var(--win-window)')};
  color: ${({ $off }) => ($off ? 'var(--win-gray-text)' : 'var(--win-window-text)')};
  & + & {
    border-top: 1px solid var(--win-light);
  }
`

const Line = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`

function MobileList(props: ReviewTableProps) {
  const { rows, onChange } = props
  return (
    <div style={{ background: 'var(--win-window)', border: '2px solid', borderColor: 'var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow)' }}>
      {rows.map((row, i) => {
        const note = noteText(row)
        return (
          <Card key={row.id} $odd={i % 2 === 1} $off={!row.include}>
            <Line>
              <Include row={row} onChange={onChange} />
              <Raw style={{ flex: 1, maxWidth: 'none', paddingTop: 0 }} title={row.raw}>{row.raw}</Raw>
              <MatchBadge row={row} />
              <PaidInput row={row} onChange={onChange} />
            </Line>
            <Line style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 38%', minWidth: 0 }}><CategorySelect row={row} onChange={onChange} /></div>
              <div style={{ flex: 1, minWidth: 0 }}><PartPicker row={row} {...props} /></div>
            </Line>
            {note && <Muted style={{ minWidth: 0 }}>Notes: {note}</Muted>}
          </Card>
        )
      })}
    </div>
  )
}
