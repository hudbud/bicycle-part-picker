import { Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell } from 'react95'
import styled from 'styled-components'
import { getCategoryLabel, productPath, productsPath } from '@/data/categoryConfig'
import { formatPrice } from '@/utils/format'
import { TextLink } from '@/components/home/HomeSections'
import { formatPct, type PriceMove } from './priceStats'

const Scroll = styled.div`
  width: 100%;
  overflow-x: auto;
`

const Num = styled(TableDataCell)`
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`

const HeadNum = styled(TableHeadCell)`
  text-align: right;
  white-space: nowrap;
`

const PartCell = styled(TableDataCell)`
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (max-width: 639px) {
    white-space: normal;
    max-width: none;
    line-height: 1.3;
    padding-top: 4px;
    padding-bottom: 4px;
  }
`

/** Category column is dropped on phones to keep the numbers on screen. */
const CatHead = styled(TableHeadCell)`
  text-align: left;
  @media (max-width: 639px) { display: none; }
`

const CatCell = styled(TableDataCell)`
  white-space: nowrap;
  @media (max-width: 639px) { display: none; }
`

interface MoversTableProps {
  rows: PriceMove[]
  /** Column header for the comparison price ("30-day high"). */
  wasLabel: string
  caption: string
}

export function MoversTable({ rows, wasLabel, caption }: MoversTableProps) {
  if (rows.length === 0) return <p style={{ fontSize: 12, padding: 8 }}>No changes in this period.</p>
  return (
    <Scroll>
      <Table style={{ width: '100%', fontSize: 12 }} aria-label={caption}>
        <TableHead>
          <TableRow>
            <TableHeadCell style={{ textAlign: 'left' }}>Part</TableHeadCell>
            <CatHead>Category</CatHead>
            <HeadNum>{wasLabel}</HeadNum>
            <HeadNum>Now</HeadNum>
            <HeadNum>Change</HeadNum>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ part, was, now, pct }) => (
            <TableRow key={part.id}>
              <PartCell title={`${part.brand} ${part.name}`}>
                <TextLink to={productPath(part.id)}>{part.brand} {part.name}</TextLink>
              </PartCell>
              <CatCell>
                <TextLink to={productsPath(part.category)} style={{ color: 'var(--win-window-text)', textDecoration: 'none' }}>
                  {getCategoryLabel(part.category) ?? part.category}
                </TextLink>
              </CatCell>
              <Num>{formatPrice(was)}</Num>
              <Num><strong>{formatPrice(now)}</strong></Num>
              <Num style={{ fontWeight: 700, color: pct < 0 ? 'var(--win-ok)' : 'var(--win-bad)' }}>
                {pct < 0 ? '▼ ' : '▲ '}{formatPct(pct)}
              </Num>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Scroll>
  )
}
