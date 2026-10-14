import styled from 'styled-components'
import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableDataCell, Button } from 'react95'
import type { Offer } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Strong } from './ProductBits'

const T = styled(Table)`
  width: 100%;
  font-size: 12px;
  th {
    white-space: nowrap;
    font-size: 12px;
  }
  td {
    padding: 4px 8px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  tbody tr {
    height: 34px;
    line-height: 1.25;
  }
  tbody tr:hover {
    background: var(--win-select-soft);
    color: var(--win-window-text);
  }
`

const Stock = ({ inStock, used }: { inStock: boolean; used?: boolean }) =>
  used ? (
    <span style={{ color: inStock ? 'var(--win-ok)' : 'var(--win-gray-text)' }}>{inStock ? '✔ Listed' : 'No listing now'}</span>
  ) : (
    <span style={{ color: inStock ? 'var(--win-ok)' : 'var(--win-bad)' }}>{inStock ? '✔ In stock' : '✖ Out of stock'}</span>
  )

const BestTag = ({ used }: { used?: boolean }) => (
  <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--win-select)', color: 'var(--win-select-text)', padding: '1px 4px' }}>{used ? 'LOWEST' : 'BEST'}</span>
)

const buy = (o: Offer) => window.open(o.url, '_blank', 'noopener,noreferrer')

export function OffersTable({ offers }: { offers: Offer[] }) {
  const narrow = useMediaQuery('(max-width: 767px)')
  if (offers.length === 0) {
    return <p style={{ fontSize: 12 }}>No retailer prices — custom parts use the price you entered.</p>
  }
  const bestIdx = offers.findIndex((o) => o.inStock)
  // Discontinued parts only get secondhand listings (eBay, Pinkbike, …): asking prices, no promos.
  const used = offers.every((o) => o.merchant.used)
  const action = used ? 'View' : 'Buy'

  if (narrow) {
    return (
      <div style={{ background: 'var(--win-window)', color: 'var(--win-window-text)', border: '2px inset var(--win-hilight)' }}>
        {offers.map((o, i) => (
          <div
            key={o.merchant.id}
            style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: 8, borderBottom: '1px solid var(--win-light)', fontSize: 12, opacity: o.inStock ? 1 : 0.6 }}
          >
            <div>
              <Strong>{o.merchant.name}</Strong>
              {i === bestIdx && <BestTag used={used} />}
              <div style={{ fontSize: 11, color: 'var(--win-muted)', marginTop: 2 }}>
                {used ? 'Asking ' : ''}
                {formatPrice(o.base)}
                {o.promo ? ` − ${formatPrice(o.promo)} promo` : ''} · {o.shipping ? `${formatPrice(o.shipping)} ship` : used ? 'local / no ship' : 'Free shipping'} ·{' '}
                <Stock inStock={o.inStock} used={used} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Strong style={{ display: 'block', fontSize: 13 }}>{formatPrice(o.total)}</Strong>
              <Button size="sm" onClick={() => buy(o)} style={{ marginTop: 4 }}>
                {action}
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <T>
        <TableHead>
          <TableRow>
            <TableHeadCell>{used ? 'Marketplace' : 'Merchant'}</TableHeadCell>
            <TableHeadCell style={{ textAlign: 'right' }}>{used ? 'Asking' : 'Base'}</TableHeadCell>
            {!used && <TableHeadCell style={{ textAlign: 'right' }}>Promo</TableHeadCell>}
            <TableHeadCell style={{ textAlign: 'right' }}>Shipping</TableHeadCell>
            <TableHeadCell>{used ? 'Listing' : 'Availability'}</TableHeadCell>
            <TableHeadCell style={{ textAlign: 'right' }}>Total</TableHeadCell>
            <TableHeadCell style={{ width: 70 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {offers.map((o, i) => (
            <TableRow key={o.merchant.id} style={{ opacity: o.inStock ? 1 : 0.65 }}>
              <TableDataCell>
                <Strong>{o.merchant.name}</Strong>
                {i === bestIdx && <BestTag used={used} />}
              </TableDataCell>
              <TableDataCell style={{ textAlign: 'right' }}>{formatPrice(o.base)}</TableDataCell>
              {!used && <TableDataCell style={{ textAlign: 'right' }}>{o.promo ? `−${formatPrice(o.promo)}` : ''}</TableDataCell>}
              <TableDataCell style={{ textAlign: 'right' }}>{o.shipping ? formatPrice(o.shipping) : 'FREE'}</TableDataCell>
              <TableDataCell>
                <Stock inStock={o.inStock} used={used} />
              </TableDataCell>
              <TableDataCell style={{ textAlign: 'right' }}>
                <Strong style={{ fontSize: 13 }}>{formatPrice(o.total)}</Strong>
              </TableDataCell>
              <TableDataCell style={{ textAlign: 'center' }}>
                <Button size="sm" onClick={() => buy(o)}>
                  {action}
                </Button>
              </TableDataCell>
            </TableRow>
          ))}
        </TableBody>
      </T>
    </div>
  )
}
