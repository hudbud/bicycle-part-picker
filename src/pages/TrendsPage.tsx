import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Window, WindowHeader, WindowContent, Button, GroupBox, Frame, Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell } from 'react95'
import styled from 'styled-components'
import { BROWSABLE_CATEGORIES, getCategoryBySlug } from '@/data/categoryConfig'
import { getPriceHistory } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { Select } from '@/components/ui/Select'
import { TrendChart, formatDay } from '@/components/trends/TrendChart'
import { MoversTable } from '@/components/trends/MoversTable'
import { categoryTrend, tierTrends, getPriceDrops, getPriceIncreases, formatPct, retailParts } from '@/components/trends/priceStats'

const RANGES = [30, 90, 180] as const
type Range = (typeof RANGES)[number]

const Page = styled.div`
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const FilterRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`

const FieldLabel = styled.span`
  display: block;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
`

const Tiles = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Tile = styled(Frame).attrs({ variant: 'field' })`
  background: var(--win-window);
  color: var(--win-window-text);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

const TileLabel = styled.span`
  font-size: 11px;
  color: var(--win-muted);
`

const TileValue = styled.span`
  font-size: 18px;
  font-weight: 700;
`

const ChartFrame = styled(Frame).attrs({ variant: 'field' })`
  width: 100%;
  background: var(--win-window);
  color: var(--win-window-text);
  padding: 10px 10px 4px 4px;
`

const Legend = styled.div`
  display: flex;
  gap: 16px;
  font-size: 11px;
  margin: 0 0 6px 4px;
  color: var(--win-text);
  align-items: center;
`

const Multiples = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const PanelTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  margin: 0 0 2px 4px;
`

const PanelSub = styled.div`
  font-size: 11px;
  color: var(--win-muted);
  margin: 0 0 4px 4px;
`

const MoversGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  @media (max-width: 1099px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Note = styled.p`
  font-size: 11px;
  color: var(--win-muted);
  line-height: 1.5;
`

const usd0 = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

/** Categories with at least one priced part, for the picker. */
function trendCategories() {
  return BROWSABLE_CATEGORIES.map((c) => ({
    meta: c,
    count: retailParts(c.id).filter((p) => getPriceHistory(p).length > 0).length,
  })).filter((c) => c.count > 0)
}

export function TrendsPage() {
  const [params, setParams] = useSearchParams()
  const [showTable, setShowTable] = useState(false)
  const categories = useMemo(trendCategories, [])

  const requested = getCategoryBySlug(params.get('category') ?? '')
  const meta = (requested && categories.find((c) => c.meta.id === requested.id)?.meta) ?? categories[0]?.meta
  const rangeParam = Number(params.get('range'))
  const range: Range = (RANGES as readonly number[]).includes(rangeParam) ? (rangeParam as Range) : 180

  const update = (next: { category?: string; range?: number }) => {
    const p = new URLSearchParams(params)
    if (next.category) p.set('category', next.category)
    if (next.range) p.set('range', String(next.range))
    setParams(p, { replace: true })
  }

  const trend = useMemo(() => (meta ? categoryTrend(meta.id, range) : null), [meta, range])
  const band = useMemo(() => (trend ? { low: trend.p25, high: trend.p75, label: '25th–75th percentile' } : undefined), [trend])
  const tiers = useMemo(() => (meta ? tierTrends(meta.id, range) : []), [meta, range])
  const tierDomain = useMemo<[number, number] | undefined>(() => {
    if (tiers.length === 0) return undefined
    const all = tiers.flatMap((t) => t.index)
    const lo = Math.min(...all, 100)
    const hi = Math.max(...all, 100)
    const pad = Math.max(1, (hi - lo) * 0.1)
    return [Math.floor(lo - pad), Math.ceil(hi + pad)]
  }, [tiers])

  const drops = useMemo(() => getPriceDrops(30).slice(0, 15), [])
  const rises = useMemo(() => getPriceIncreases(30).slice(0, 15), [])

  const has = trend && trend.median.length > 0
  const first = has ? trend.median[0] : 0
  const last = has ? trend.median[trend.median.length - 1] : 0
  const change = first > 0 ? (last - first) / first : 0
  const weekly = has ? trend.dates.map((d, i) => ({ d, i })).filter(({ i }) => (trend.dates.length - 1 - i) % 7 === 0).reverse() : []

  return (
    <Page>
      <Window style={{ width: '100%' }}>
        <WindowHeader active><span>Price Trends</span></WindowHeader>
        <WindowContent>
          <Note style={{ marginBottom: 10 }}>
            Daily lowest in-stock price across tracked retailers, aggregated over every part in a category.
            Prices are <strong>simulated sample data</strong>, not a live feed. Discontinued parts (used-market values) are left out.
          </Note>

          <FilterRow>
            <div style={{ width: 240 }}>
              <Select
                label="Category"
                value={meta?.slug ?? ''}
                options={categories.map((c) => ({ value: c.meta.slug, label: `${c.meta.plural} (${c.count})` }))}
                onChange={(e) => update({ category: e.target.value })}
              />
            </div>
            <div role="group" aria-label="Time range">
              <FieldLabel>Range</FieldLabel>
              <div style={{ display: 'flex', gap: 2 }}>
                {RANGES.map((r) => (
                  <Button key={r} active={r === range} aria-pressed={r === range} onClick={() => update({ range: r })} style={{ minWidth: 64 }}>
                    {r} days
                  </Button>
                ))}
              </div>
            </div>
          </FilterRow>

          {!has || !meta ? (
            <Note>No price history for this category yet.</Note>
          ) : (
            <>
              <Tiles>
                <Tile><TileLabel>Median price today</TileLabel><TileValue>{formatPrice(last)}</TileValue></Tile>
                <Tile>
                  <TileLabel>Median change, {range} days</TileLabel>
                  <TileValue>{change < 0 ? '▼ ' : change > 0 ? '▲ ' : ''}{formatPct(change)}</TileValue>
                </Tile>
                <Tile>
                  <TileLabel>Middle 50% today</TileLabel>
                  <TileValue>{usd0(trend.p25[trend.p25.length - 1])}–{usd0(trend.p75[trend.p75.length - 1])}</TileValue>
                </Tile>
                <Tile><TileLabel>Parts tracked</TileLabel><TileValue>{trend.partCount}</TileValue></Tile>
              </Tiles>

              <GroupBox label={`${meta.plural} — median best price`} style={{ marginBottom: 12 }}>
                <Legend aria-hidden="true">
                  <span><span style={{ display: 'inline-block', width: 16, height: 2, background: 'var(--win-link)', verticalAlign: 'middle', marginRight: 6 }} />Median</span>
                  <span><span style={{ display: 'inline-block', width: 16, height: 10, background: 'var(--win-link)', opacity: 0.15, verticalAlign: 'middle', marginRight: 6 }} />25th–75th percentile</span>
                </Legend>
                <ChartFrame>
                  <TrendChart
                    dates={trend.dates}
                    values={trend.median}
                    valueLabel="Median"
                    band={band}
                    height={280}
                    formatValue={formatPrice}
                    formatTick={usd0}
                    endLabel={usd0(last)}
                    ariaLabel={`Line chart: median best price of ${meta.plural.toLowerCase()} over the last ${range} days, with the 25th to 75th percentile band.`}
                  />
                </ChartFrame>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
                  <Note>Hover or focus the chart and use ←/→ to read daily values.</Note>
                  <Button size="sm" onClick={() => setShowTable((s) => !s)} aria-expanded={showTable}>
                    {showTable ? 'Hide data table' : 'Show data table'}
                  </Button>
                </div>
                {showTable && (
                  <div style={{ maxHeight: 280, overflow: 'auto', marginTop: 6 }}>
                    <Table style={{ width: '100%', fontSize: 12 }} aria-label={`${meta.plural} weekly price percentiles`}>
                      <TableHead>
                        <TableRow>
                          <TableHeadCell style={{ textAlign: 'left' }}>Date</TableHeadCell>
                          <TableHeadCell style={{ textAlign: 'right' }}>25th pct.</TableHeadCell>
                          <TableHeadCell style={{ textAlign: 'right' }}>Median</TableHeadCell>
                          <TableHeadCell style={{ textAlign: 'right' }}>75th pct.</TableHeadCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {weekly.map(({ d, i }) => (
                          <TableRow key={d}>
                            <TableDataCell>{formatDay(d)}</TableDataCell>
                            <TableDataCell style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(trend.p25[i])}</TableDataCell>
                            <TableDataCell style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><strong>{formatPrice(trend.median[i])}</strong></TableDataCell>
                            <TableDataCell style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(trend.p75[i])}</TableDataCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </GroupBox>

              {tiers.length > 0 && (
                <GroupBox label="By price tier">
                  <Note style={{ margin: '0 0 8px 4px' }}>Median price indexed to 100 at the start of the {range}-day range.</Note>
                  <Multiples>
                    {tiers.map((t) => {
                      const end = t.index[t.index.length - 1]
                      return (
                        <div key={t.label}>
                          <PanelTitle>{t.label}</PanelTitle>
                          <PanelSub>{usd0(t.min)}–{usd0(t.max)} MSRP · {t.partCount} parts</PanelSub>
                          <ChartFrame>
                            <TrendChart
                              dates={t.dates}
                              values={t.index}
                              valueLabel="index"
                              height={150}
                              compact
                              yDomain={tierDomain}
                              baseline={100}
                              formatValue={(n) => n.toFixed(1)}
                              formatTick={(n) => n.toFixed(0)}
                              endLabel={formatPct(end / 100 - 1)}
                              ariaLabel={`${t.label} ${meta.plural.toLowerCase()}: median price index over ${range} days, ending at ${end.toFixed(1)}.`}
                            />
                          </ChartFrame>
                        </div>
                      )
                    })}
                  </Multiples>
                  <Note style={{ marginTop: 6 }}>Tiers split the category into thirds by MSRP. All panels share one scale.</Note>
                </GroupBox>
              )}
            </>
          )}
        </WindowContent>
      </Window>

      <MoversGrid>
        <Window style={{ width: '100%', minWidth: 0 }}>
          <WindowHeader active><span>Biggest Price Drops (30 days)</span></WindowHeader>
          <WindowContent style={{ padding: 8 }}>
            <MoversTable rows={drops} wasLabel="30-day high" caption="Biggest price drops in the last 30 days" />
            <Note style={{ marginTop: 6 }}>Today’s best price vs. the highest best price in the previous 30 days.</Note>
          </WindowContent>
        </Window>
        <Window style={{ width: '100%', minWidth: 0 }}>
          <WindowHeader active><span>Price Increases (30 days)</span></WindowHeader>
          <WindowContent style={{ padding: 8 }}>
            <MoversTable rows={rises} wasLabel="30-day low" caption="Biggest price increases in the last 30 days" />
            <Note style={{ marginTop: 6 }}>Today’s best price vs. the lowest best price in the previous 30 days.</Note>
          </WindowContent>
        </Window>
      </MoversGrid>
    </Page>
  )
}
