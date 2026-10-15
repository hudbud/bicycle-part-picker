import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { Button } from 'react95'
import type { PricePoint } from '@/data/pricing'
import { formatPrice } from '@/utils/format'

/*
 * Single-series price history. Win95 palette: scheme link-color line on the window field, hairline
 * stripe-color grid, text in black/gray ink (never the series color). Prices hold until
 * a retailer changes them, so the line is drawn as a step.
 */

// The series is drawn in currentColor; the svg's color is the scheme's link color.
const NAVY = 'currentColor'
const GRID = 'var(--win-stripe)'
const AXIS = 'var(--win-shadow)'
const INK = 'var(--win-window-text)'
const INK_MUTED = 'var(--win-muted)'
// Halo around series dots: matches the plot field so it reads as a cut-out.
const HALO = 'var(--win-window)'

const RANGES = [30, 90, 180] as const
type RangeDays = (typeof RANGES)[number]

const HEIGHT = 240
const M = { top: 14, right: 64, bottom: 26, left: 58 }

const Field = styled.div`
  position: relative;
  background: var(--win-window);
  color: var(--win-window-text);
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  box-shadow: inset 1px 1px 0 var(--win-dkshadow);
`

const Tip = styled.div`
  position: absolute;
  pointer-events: none;
  background: var(--win-info);
  color: var(--win-info-text);
  border: 1px solid var(--win-dkshadow);
  padding: 3px 6px;
  font-size: 11px;
  line-height: 1.35;
  white-space: nowrap;
  box-shadow: 1px 1px 0 var(--win-shadow);
`

const Stats = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  margin: 8px 0;

  span.k {
    color: ${INK_MUTED};
    margin-right: 4px;
  }
  span.v {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`

const fmtDate = (iso: string, withYear = false) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) })

/** ~4–5 clean price ticks covering [lo, hi]. */
function niceTicks(lo: number, hi: number, count = 4): number[] {
  const span = Math.max(hi - lo, Math.max(1, hi * 0.02))
  const raw = span / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const start = Math.floor(lo / step) * step
  const ticks: number[] = []
  for (let v = start; v <= hi + step * 0.5; v += step) ticks.push(Math.round(v * 100) / 100)
  if (ticks.length < 2) ticks.push(start + step)
  return ticks
}

const tickLabel = (v: number) => (v >= 1000 ? `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `$${v.toFixed(v % 1 ? 2 : 0)}`)

export function PriceHistoryChart({ history }: { history: PricePoint[] }) {
  const [range, setRange] = useState<RangeDays>(90)
  const [hover, setHover] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.floor(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const points = useMemo(() => history.slice(-range), [history, range])

  const geo = useMemo(() => {
    if (points.length === 0) return null
    const prices = points.map((p) => p.price)
    const lo = Math.min(...prices)
    const hi = Math.max(...prices)
    const ticks = niceTicks(lo * 0.97, hi * 1.02)
    const y0 = ticks[0]
    const y1 = ticks[ticks.length - 1]
    const iw = width - M.left - M.right
    const ih = HEIGHT - M.top - M.bottom
    const x = (i: number) => M.left + (points.length === 1 ? iw : (i / (points.length - 1)) * iw)
    const y = (v: number) => M.top + ih - ((v - y0) / (y1 - y0 || 1)) * ih
    // Step-after: a price holds until the next change.
    let d = `M${x(0)},${y(points[0].price)}`
    for (let i = 1; i < points.length; i++) d += `H${x(i)}V${y(points[i].price)}`
    const area = `${d}V${y(y0)}H${x(0)}Z`
    const minI = prices.indexOf(lo)
    const maxI = prices.indexOf(hi)
    const xTickCount = width < 420 ? 3 : 5
    const xTicks = Array.from({ length: xTickCount }, (_, k) => Math.round((k / (xTickCount - 1)) * (points.length - 1)))
    return { lo, hi, ticks, x, y, d, area, minI, maxI, xTicks, ih, iw }
  }, [points, width])

  if (history.length === 0 || !geo) {
    return <p style={{ fontSize: 12 }}>No price history — this part has no retailer prices.</p>
  }

  const last = points.length - 1
  const current = points[last].price
  const first = points[0].price
  const change = current - first

  const onMove = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * width
    const i = Math.round(((px - M.left) / geo.iw) * last)
    setHover(Math.max(0, Math.min(last, i)))
  }

  const hp = hover != null ? points[hover] : null
  const tipLeft = hover != null ? geo.x(hover) : 0

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }} role="group" aria-label="Date range">
        {RANGES.map((r) => (
          <Button key={r} size="sm" active={range === r} onClick={() => setRange(r)} aria-pressed={range === r} style={{ minWidth: 48 }}>
            {r}d
          </Button>
        ))}
        <span style={{ fontSize: 11, color: INK_MUTED, marginLeft: 8 }}>Lowest in-stock price, daily</span>
      </div>

      <Stats>
        <span>
          <span className="k">Current</span>
          <span className="v">{formatPrice(current)}</span>
        </span>
        <span>
          <span className="k">{range}d low</span>
          <span className="v">{formatPrice(geo.lo)}</span> <span className="k">{fmtDate(points[geo.minI].date)}</span>
        </span>
        <span>
          <span className="k">{range}d high</span>
          <span className="v">{formatPrice(geo.hi)}</span> <span className="k">{fmtDate(points[geo.maxI].date)}</span>
        </span>
        <span>
          <span className="k">Change</span>
          <span className="v">
            {change === 0 ? 'No change' : `${change < 0 ? '▼' : '▲'} ${formatPrice(Math.abs(change))} (${Math.abs((change / first) * 100).toFixed(1)}%)`}
          </span>
        </span>
      </Stats>

      <Field ref={wrapRef}>
        <svg
          width="100%"
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`Price history, last ${range} days: low ${formatPrice(geo.lo)}, high ${formatPrice(geo.hi)}, current ${formatPrice(current)}`}
          tabIndex={0}
          style={{ display: 'block', outline: 'none', fontFamily: 'inherit', touchAction: 'pan-y', color: 'var(--win-link)' }}
          onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(last)}
          onBlur={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? last) - 1))
            else if (e.key === 'ArrowRight') setHover((h) => Math.min(last, (h ?? last) + 1))
            else if (e.key === 'Home') setHover(0)
            else if (e.key === 'End') setHover(last)
          }}
        >
          {/* grid + y labels */}
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={geo.y(t)} y2={geo.y(t)} strokeWidth={1} shapeRendering="crispEdges" style={{ stroke: GRID }} />
              <text x={M.left - 6} y={geo.y(t)} dy="0.32em" textAnchor="end" fontSize={11} style={{ fill: INK_MUTED, fontVariantNumeric: 'tabular-nums' }}>
                {tickLabel(t)}
              </text>
            </g>
          ))}
          {/* x axis */}
          <line x1={M.left} x2={width - M.right} y1={M.top + geo.ih} y2={M.top + geo.ih} strokeWidth={1} shapeRendering="crispEdges" style={{ stroke: AXIS }} />
          {geo.xTicks.map((i, k) => (
            <text
              key={i}
              x={geo.x(i)}
              y={HEIGHT - 8}
              fontSize={11}
              style={{ fill: INK_MUTED }}
              textAnchor={k === 0 ? 'start' : k === geo.xTicks.length - 1 ? 'end' : 'middle'}
            >
              {fmtDate(points[i].date)}
            </text>
          ))}

          <path d={geo.area} fill={NAVY} fillOpacity={0.1} />
          <path d={geo.d} fill="none" stroke={NAVY} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* low / high markers (skip if they coincide with the end dot) */}
          {[
            { i: geo.minI, label: 'Low' },
            { i: geo.maxI, label: 'High' },
          ]
            .filter((m) => m.i !== last && !(m.label === 'High' && geo.maxI === geo.minI))
            .map((m) => (
              <g key={m.label}>
                <circle cx={geo.x(m.i)} cy={geo.y(points[m.i].price)} r={4} fill={NAVY} strokeWidth={2} style={{ stroke: HALO }} />
                <text
                  x={geo.x(m.i)}
                  y={geo.y(points[m.i].price) + (m.label === 'High' ? -9 : 16)}
                  fontSize={10}
                  textAnchor={geo.x(m.i) < M.left + 30 ? 'start' : geo.x(m.i) > width - M.right - 30 ? 'end' : 'middle'}
                  style={{ fill: INK }}
                >
                  {m.label} {formatPrice(points[m.i].price)}
                </text>
              </g>
            ))}

          {/* current end dot + direct label */}
          <circle cx={geo.x(last)} cy={geo.y(current)} r={4} fill={NAVY} strokeWidth={2} style={{ stroke: HALO }} />
          <text x={geo.x(last) + 8} y={geo.y(current)} dy="0.32em" fontSize={11} fontWeight={700} style={{ fill: INK }}>
            {formatPrice(current)}
          </text>

          {/* crosshair */}
          {hp && hover != null && (
            <g pointerEvents="none">
              <line x1={geo.x(hover)} x2={geo.x(hover)} y1={M.top} y2={M.top + geo.ih} strokeWidth={1} shapeRendering="crispEdges" style={{ stroke: AXIS }} />
              <circle cx={geo.x(hover)} cy={geo.y(hp.price)} r={4} fill={NAVY} strokeWidth={2} style={{ stroke: HALO }} />
            </g>
          )}
        </svg>

        {hp && hover != null && (
          <Tip
            style={{
              top: Math.max(0, geo.y(hp.price) - 44),
              left: `${(tipLeft / width) * 100}%`,
              transform: tipLeft > width * 0.7 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
            }}
            role="status"
          >
            <div style={{ fontWeight: 700, fontSize: 12 }}>{formatPrice(hp.price)}</div>
            <div style={{ color: INK_MUTED }}>{fmtDate(hp.date, true)}</div>
          </Tip>
        )}
      </Field>

      <details style={{ marginTop: 8, fontSize: 12 }}>
        <summary style={{ cursor: 'pointer' }}>View as table</summary>
        <div style={{ maxHeight: 200, overflowY: 'auto', background: 'var(--win-window)', color: 'var(--win-window-text)', border: '1px solid var(--win-shadow)', marginTop: 4 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '2px 6px', background: 'var(--win-face)', color: 'var(--win-text)' }}>Date</th>
                <th style={{ textAlign: 'right', padding: '2px 6px', background: 'var(--win-face)', color: 'var(--win-text)' }}>Lowest price</th>
              </tr>
            </thead>
            <tbody>
              {points
                .filter((p, i) => i === 0 || p.price !== points[i - 1].price)
                .reverse()
                .map((p) => (
                  <tr key={p.date}>
                    <td style={{ padding: '2px 6px' }}>{fmtDate(p.date, true)}</td>
                    <td style={{ padding: '2px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(p.price)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div style={{ color: INK_MUTED, marginTop: 2 }}>Rows show each day the price changed.</div>
      </details>
    </div>
  )
}
