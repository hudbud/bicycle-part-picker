import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import type { Build } from '@/types/build'
import { useGarageStore } from '@/store/garageStore'
import { useBuildStore } from '@/store/buildStore'
import { usePartsBinStore } from '@/store/partsBinStore'
import { useSettingsStore } from '@/store/settingsStore'
import { estimateWeight } from '@/compat/engine'
import { ACQUIRED_STATUSES, getTrackingTotals } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { formatDistance } from '@/utils/distance'
import { StageBadge } from '@/components/tracking/StageBadge'

const A = styled(Link)`
  color: var(--win-link);
  text-decoration: underline;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  background: var(--win-window);
  color: var(--win-window-text);
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  th {
    text-align: left;
    font-weight: 700;
    font-size: 11px;
    padding: 3px 6px;
    background: var(--win-face);
    color: var(--win-text);
    border-bottom: 1px solid var(--win-shadow);
    white-space: nowrap;
  }
  td {
    padding: 4px 6px;
    border-bottom: 1px solid var(--win-light);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  td:first-child {
    white-space: normal;
  }
  .r {
    text-align: right;
  }
  @media (max-width: 639px) {
    .wide {
      display: none;
    }
  }
`

const Line = styled.p`
  font-size: 12px;
  margin: 8px 0 0;
  line-height: 1.5;
`

function bikeRow(b: Build) {
  const totals = getTrackingTotals(b)
  const parts = b.components.filter((s) => s.part).length
  return { totals, parts, weight: estimateWeight(b) }
}

/** The visitor's own bikes + parts bin at a glance. Renders nothing when nothing is tracked yet. */
export function TrackerSummary() {
  const garage = useGarageStore((s) => s.builds)
  const current = useBuildStore((s) => s.build)
  const items = usePartsBinStore((s) => s.items)
  const unit = useSettingsStore((s) => s.distanceUnit)

  const bikes = useMemo(() => {
    const list = [...garage].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    const unsaved = (!current.id || !garage.some((g) => g.id === current.id)) && current.components.some((s) => s.part)
    return { list: list.slice(0, 5), more: Math.max(0, list.length - 5), unsaved }
  }, [garage, current])

  const bin = useMemo(() => {
    let paid = 0
    let owned = 0
    let wanted = 0
    for (const i of items) {
      if (i.status === 'wanted') wanted++
      else if (ACQUIRED_STATUSES.has(i.status)) {
        owned++
        paid += i.tracking?.pricePaid ?? 0
      }
    }
    return { paid, owned, wanted }
  }, [items])

  if (garage.length === 0 && items.length === 0 && !bikes.unsaved) return null

  return (
    <div>
      {garage.length > 0 && (
        <Table>
          <thead>
            <tr>
              <th>Bike</th>
              <th className="wide">Stage</th>
              <th className="r wide">Parts</th>
              <th className="r">Weight</th>
              <th className="r">Spent</th>
              <th className="r">To buy</th>
              <th className="r wide">Odometer</th>
            </tr>
          </thead>
          <tbody>
            {bikes.list.map((b) => {
              const r = bikeRow(b)
              return (
                <tr key={b.id}>
                  <td>
                    <A to={`/garage/${b.id}`}>{b.name || 'Untitled bike'}</A>
                  </td>
                  <td className="wide">{b.stage ? <StageBadge stage={b.stage} /> : <span style={{ color: 'var(--win-gray-text)' }}>—</span>}</td>
                  <td className="r wide">{r.parts}</td>
                  <td className="r">{r.weight.grams > 0 ? `${r.weight.formatted}${r.weight.unknown ? '+' : ''}` : '—'}</td>
                  <td className="r">
                    {formatPrice(r.totals.spent)}
                    {r.totals.unrecorded > 0 ? '+' : ''}
                  </td>
                  <td className="r">{r.totals.toBuyCount > 0 ? formatPrice(r.totals.toBuy) : '—'}</td>
                  <td className="r wide">{formatDistance(b.odometerKm, unit)}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
      <Line>
        {bikes.more > 0 && (
          <>
            <A to="/garage">+{bikes.more} more in the Garage</A> ·{' '}
          </>
        )}
        {bikes.unsaved && (
          <>
            Unsaved build in the <A to="/build">Builder</A>
            {current.name ? ` (${current.name})` : ''} ·{' '}
          </>
        )}
        <A to="/parts">Parts Bin</A>: {bin.owned} owned{bin.paid > 0 ? ` (${formatPrice(bin.paid)} paid)` : ''} · {bin.wanted} on the wishlist
      </Line>
    </div>
  )
}

const FeatureGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin: 0;
  font-size: 12px;
  @media (max-width: 860px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 479px) {
    grid-template-columns: minmax(0, 1fr);
  }
  div {
    background: var(--win-window);
    color: var(--win-window-text);
    border: 2px solid;
    border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
    padding: 6px 8px;
  }
  dt {
    font-weight: 700;
    margin-bottom: 2px;
  }
  dd {
    margin: 0;
    line-height: 1.4;
    color: var(--win-window-text);
  }
`

const FEATURES: { title: string; to: string; text: string }[] = [
  { title: 'Compatibility checker', to: '/build', text: 'Wheel size, axles, BB shell, brake mounts, steerer, drivetrain speeds — flagged as you pick, modern or vintage.' },
  { title: 'Weights', to: '/build', text: 'Claimed weight per part and a running bike total, so you know what the build will weigh before you buy.' },
  { title: 'What you paid', to: '/garage', text: 'Record price paid, source, date and condition for every part. See spent vs. still to buy per bike.' },
  { title: 'Parts bin', to: '/parts', text: 'Spares, take-offs and wishlist parts — with where each one is, and one click to install it on a bike.' },
  { title: 'Service log', to: '/garage', text: 'Odometer, chain and brake swaps, bearing service, in mi or km — per bike, kept with the build.' },
  { title: 'Catalog & prices', to: '/products', text: 'Current and discontinued parts with specs; simulated retail and used-market prices for planning.' },
]

/** What the tracker does, as a dense grid of linked feature cells. */
export function FeatureList() {
  return (
    <FeatureGrid>
      {FEATURES.map((f) => (
        <div key={f.title}>
          <dt>
            <A to={f.to}>{f.title}</A>
          </dt>
          <dd>{f.text}</dd>
        </div>
      ))}
    </FeatureGrid>
  )
}
