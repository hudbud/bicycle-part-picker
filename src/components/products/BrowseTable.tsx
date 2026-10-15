import styled from 'styled-components'
import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableDataCell, Checkbox, Button } from 'react95'
import type { Part } from '@/types/parts'
import type { CompatIssue } from '@/compat/engine'
import { getSpecValue, formatSpecValue, type SpecField } from '@/data/specSchema'
import { getRating } from '@/data/pricing'
import { Stars } from '@/components/ui/Stars'
import { PartNameLink, PriceCell, IssuesIcon, EraTag, HaveTag } from './ProductBits'
import { useHavePartIds } from './useTracked'

export const MAX_COMPARE = 4

const ScrollX = styled.div`
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
    padding: 4px 6px;
    vertical-align: middle;
  }
  tbody tr {
    height: 40px;
    line-height: 1.25;
  }
  tbody tr:nth-child(even) {
    background: var(--win-stripe);
  }
  tbody tr:hover {
    background: var(--win-select-soft);
    color: var(--win-window-text);
  }
  td label {
    margin: 0;
  }
`

const SortHead = styled(TableHeadCell)<{ $active?: boolean }>`
  cursor: pointer;
  ${({ $active }) => ($active ? 'font-weight: 700;' : '')}
`

const NameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 180px;
  line-height: 1.3;
`

const InBuild = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 6px;
  border: 1px solid var(--win-shadow);
  background: var(--win-window);
  color: var(--win-window-text);
  white-space: nowrap;
`

const MobileRow = styled.div<{ $odd?: boolean }>`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 4px 8px;
  padding: 8px;
  border-bottom: 1px solid var(--win-light);
  background: ${({ $odd }) => ($odd ? 'var(--win-stripe)' : 'var(--win-window)')};
  font-size: 12px;
`

const SpecLine = styled.div`
  grid-column: 2 / 4;
  color: var(--win-muted);
  font-size: 11px;
  line-height: 1.4;
`

export interface BrowseTableProps {
  parts: Part[]
  columns: SpecField[]
  issuesFor: (part: Part) => CompatIssue[]
  sort: string
  dir: 'asc' | 'desc'
  onSort: (key: string) => void
  compareIds: string[]
  onToggleCompare: (id: string) => void
  inBuildId?: string
  onAdd: (part: Part) => void
  mobile?: boolean
}

export function BrowseTable(props: BrowseTableProps) {
  return props.mobile ? <MobileList {...props} /> : <DesktopTable {...props} />
}

/** Era + "you have this" markers after the part name. */
function NameTags({ part, have }: { part: Part; have: boolean }) {
  if (!part.discontinued && !have) return null
  return (
    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      <EraTag part={part} />
      {have && <HaveTag />}
    </span>
  )
}

function DesktopTable({ parts, columns, issuesFor, sort, dir, onSort, compareIds, onToggleCompare, inBuildId, onAdd }: BrowseTableProps) {
  const head = (key: string, label: string, align: 'left' | 'right' = 'left') => {
    const active = sort === key
    return (
      <SortHead
        key={key}
        $active={active}
        sort={active ? dir : null}
        onClick={() => onSort(key)}
        style={{ textAlign: align }}
        title={`Sort by ${label}`}
      >
        {label}
        <span style={{ marginLeft: 4, fontSize: 9, opacity: active ? 1 : 0.35 }}>{active ? (dir === 'asc' ? '▲' : '▼') : '▲▼'}</span>
      </SortHead>
    )
  }
  const full = compareIds.length >= MAX_COMPARE
  const have = useHavePartIds()
  return (
    <ScrollX>
      <T>
        <TableHead>
          <TableRow>
            <TableHeadCell style={{ width: 28 }} title="Select up to 4 to compare">
              <span style={{ fontSize: 10 }}>Cmp</span>
            </TableHeadCell>
            {head('name', 'Name')}
            {columns.map((c) => head(c.key, c.label))}
            {head('rating', 'Rating')}
            {head('price', 'Price', 'right')}
            <TableHeadCell style={{ width: 70 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {parts.map((part) => {
            const checked = compareIds.includes(part.id)
            return (
              <TableRow key={part.id}>
                <TableDataCell style={{ textAlign: 'center' }}>
                  <Checkbox
                    checked={checked}
                    disabled={!checked && full}
                    onChange={() => onToggleCompare(part.id)}
                    aria-label={`Compare ${part.brand} ${part.name}`}
                    style={{ margin: 0 }}
                  />
                </TableDataCell>
                <TableDataCell>
                  <NameCell>
                    <IssuesIcon issues={issuesFor(part)} />
                    <span>
                      <PartNameLink part={part} /> <NameTags part={part} have={have.has(part.id)} />
                    </span>
                  </NameCell>
                </TableDataCell>
                {columns.map((c) => (
                  <TableDataCell key={c.key} style={{ whiteSpace: 'nowrap' }}>
                    {formatSpecValue(c, getSpecValue(part, c.key))}
                  </TableDataCell>
                ))}
                <TableDataCell>
                  <Stars rating={getRating(part)} />
                </TableDataCell>
                <TableDataCell style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <PriceCell part={part} />
                </TableDataCell>
                <TableDataCell style={{ textAlign: 'center' }}>
                  {inBuildId === part.id ? (
                    <InBuild>In build</InBuild>
                  ) : (
                    <Button size="sm" onClick={() => onAdd(part)} style={{ fontWeight: 700 }}>
                      Add
                    </Button>
                  )}
                </TableDataCell>
              </TableRow>
            )
          })}
        </TableBody>
      </T>
    </ScrollX>
  )
}

function MobileList({ parts, columns, issuesFor, compareIds, onToggleCompare, inBuildId, onAdd }: BrowseTableProps) {
  const full = compareIds.length >= MAX_COMPARE
  const have = useHavePartIds()
  return (
    <div style={{ background: 'var(--win-window)', color: 'var(--win-window-text)', border: '2px inset var(--win-hilight)' }}>
      {parts.map((part, i) => {
        const checked = compareIds.includes(part.id)
        const specs = columns
          .map((c) => ({ c, v: formatSpecValue(c, getSpecValue(part, c.key)) }))
          .filter(({ v }) => v !== '—')
        return (
          <MobileRow key={part.id} $odd={i % 2 === 1}>
            <Checkbox
              checked={checked}
              disabled={!checked && full}
              onChange={() => onToggleCompare(part.id)}
              aria-label={`Compare ${part.brand} ${part.name}`}
              style={{ margin: 0 }}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', lineHeight: 1.3 }}>
              <IssuesIcon issues={issuesFor(part)} />
              <span>
                <PartNameLink part={part} /> <NameTags part={part} have={have.has(part.id)} />
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <PriceCell part={part} />
            </div>
            <SpecLine>
              {specs.length > 0 && <div>{specs.map(({ c, v }) => `${c.label}: ${v}`).join(' · ')}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Stars rating={getRating(part)} />
                {inBuildId === part.id ? (
                  <InBuild>In build</InBuild>
                ) : (
                  <Button size="sm" onClick={() => onAdd(part)} style={{ fontWeight: 700 }}>
                    Add
                  </Button>
                )}
              </div>
            </SpecLine>
          </MobileRow>
        )
      })}
    </div>
  )
}
