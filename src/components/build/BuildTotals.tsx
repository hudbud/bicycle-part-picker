import type { Build } from '@/types/build'
import { getBuildTotals, getTrackingTotals } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import styled from 'styled-components'

const Box = styled.table`
  margin-left: auto;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 240px;

  td { padding: 2px 8px; vertical-align: baseline; }
  td:nth-child(2) { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.sub { font-size: 11px; color: var(--win-muted); padding-top: 0; }
  tr.lead td { font-size: 14px; font-weight: 700; }
  tr.total td {
    border-top: 1px solid var(--win-shadow);
    padding-top: 4px;
    font-size: 15px;
    font-weight: 700;
  }
`

const Foot = styled.p`
  font-size: 11px;
  text-align: right;
  margin: 2px 8px 0;
  color: var(--win-muted);
`

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** Market view: Parts / Extras / Total at today's best prices (read-only guides, shared builds). */
function MarketTotals({ build }: { build: Build }) {
  const t = getBuildTotals(build)
  const approx = t.missingPrices > 0 ? '~' : ''
  const hasExtras = (build.additionalItems ?? []).length > 0
  return (
    <div>
      <Box>
        <tbody>
          <tr><td>Parts:</td><td>{approx}{formatPrice(t.parts)}</td></tr>
          {hasExtras && <tr><td>Extras:</td><td>{formatPrice(t.extras)}</td></tr>}
          <tr className="total"><td>Total:</td><td>{approx}{formatPrice(t.total)}</td></tr>
        </tbody>
      </Box>
      {t.missingPrices > 0 && <Foot>~ {plural(t.missingPrices, 'part')} {t.missingPrices === 1 ? 'has' : 'have'} no price.</Foot>}
    </div>
  )
}

/**
 * Tracker view: what you've spent on parts you have vs. what's still to buy (at today's
 * best price), plus extras and service costs. Market value is a quiet footnote.
 */
function TrackingTotalsBox({ build }: { build: Build }) {
  const t = getTrackingTotals(build)
  const market = getBuildTotals(build)
  const hasExtras = (build.additionalItems ?? []).length > 0
  const hasService = (build.serviceLog ?? []).some((e) => e.cost != null)
  const total = t.spent + t.toBuy + t.extras + t.service
  const approx = t.unrecorded > 0 || t.toBuyUnpriced > 0 ? '~' : ''
  return (
    <div>
      <Box>
        <tbody>
          <tr className="lead">
            <td>Spent so far:</td>
            <td>{t.unrecorded > 0 && t.spent > 0 ? '≥ ' : ''}{t.acquiredCount === 0 ? '—' : formatPrice(t.spent)}</td>
          </tr>
          {t.unrecorded > 0 && (
            <tr><td className="sub" colSpan={2}>{plural(t.unrecorded, 'part')} with no price recorded</td></tr>
          )}
          <tr className="lead">
            <td>Still to buy:</td>
            <td>{t.toBuyCount === 0 ? '—' : `${t.toBuyUnpriced ? '~' : ''}${formatPrice(t.toBuy)}`}</td>
          </tr>
          {t.toBuyCount > 0 && (
            <tr>
              <td className="sub" colSpan={2}>
                {plural(t.toBuyCount, 'part')} at today’s best price{t.toBuyUnpriced > 0 ? ` (${t.toBuyUnpriced} unpriced)` : ''}
              </td>
            </tr>
          )}
          {hasExtras && <tr><td>Extras:</td><td>{formatPrice(t.extras)}</td></tr>}
          {hasService && <tr><td>Service:</td><td>{formatPrice(t.service)}</td></tr>}
          <tr className="total"><td>All-in:</td><td>{approx}{formatPrice(total)}</td></tr>
        </tbody>
      </Box>
      {market.parts > 0 && (
        <Foot title="Every selected part at today's best (simulated) price, whether or not you own it">
          Market value of parts today: {market.missingPrices ? '~' : ''}{formatPrice(market.parts)}
        </Foot>
      )}
    </div>
  )
}

/**
 * Build money summary. `mode="tracking"` (the builder and garage bike pages) leads with
 * Spent so far vs. Still to buy; `mode="market"` (default — guides, shared and community
 * builds) is the classic Parts / Extras / Total at live prices.
 */
export function BuildTotals({ build, mode = 'market' }: { build: Build; mode?: 'market' | 'tracking' }) {
  return mode === 'tracking' ? <TrackingTotalsBox build={build} /> : <MarketTotals build={build} />
}
