import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import styled from 'styled-components'

/**
 * Lightweight SVG time-series chart in the Win95 palette: one 2px navy line, an optional
 * percentile band (navy wash), hairline solid grid, a crosshair + tooltip on hover and
 * keyboard focus (←/→/Home/End). No dependencies.
 */

// Chart chrome follows the color scheme (the chart sits on a window-colored surface);
// SERIES is currentColor, set to the scheme's link color on the svg.
const INK = 'var(--win-window-text)'
const INK_MUTED = 'var(--win-muted)'
const GRID = 'var(--win-stripe)'
const AXIS = 'var(--win-shadow)'
const SERIES = 'currentColor'
const SURFACE = 'var(--win-window)'

export interface TrendChartProps {
  dates: string[]
  values: number[]
  /** Name of the line, shown in the tooltip ("Median"). */
  valueLabel: string
  band?: { low: number[]; high: number[]; label: string }
  height?: number
  formatValue: (n: number) => string
  /** Tick label formatter; defaults to formatValue. */
  formatTick?: (n: number) => string
  /** Force a y-domain (e.g. shared across small multiples). */
  yDomain?: [number, number]
  /** Horizontal reference line (e.g. index = 100). */
  baseline?: number
  /** Text drawn next to the last point. */
  endLabel?: string
  /** Accessible summary of what the chart shows. */
  ariaLabel: string
  /** Fewer ticks for small multiples. */
  compact?: boolean
}

const Wrap = styled.div`
  position: relative;
  width: 100%;
  font-family: 'ms_sans_serif', sans-serif;
  svg { display: block; overflow: visible; }
  svg:focus { outline: none; }
  svg:focus-visible { outline: 1px dotted var(--win-window-text); outline-offset: 2px; }
`

const Tip = styled.div`
  position: absolute;
  pointer-events: none;
  z-index: 5;
  background: var(--win-info);
  border: 1px solid var(--win-dkshadow);
  box-shadow: 1px 1px 0 var(--win-shadow);
  padding: 3px 6px;
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
  color: var(--win-info-text);
`

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** ~`count` round tick values spanning [min, max]. */
function niceTicks(min: number, max: number, count: number): number[] {
  if (!(max > min)) return [min]
  const raw = (max - min) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) ticks.push(+v.toFixed(10))
  return ticks
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const parseDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}
export const formatDay = (iso: string) => {
  const { m, d, y } = parseDay(iso)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

function xTicks(dates: string[], compact: boolean): { i: number; label: string }[] {
  const out: { i: number; label: string }[] = []
  if (dates.length <= 45) {
    const step = compact ? 14 : 7
    for (let i = dates.length - 1; i >= 0; i -= step) {
      const { m, d } = parseDay(dates[i])
      out.unshift({ i, label: `${MONTHS[m - 1]} ${d}` })
    }
    return out
  }
  dates.forEach((iso, i) => {
    const { m, d } = parseDay(iso)
    if (d === 1 && (!compact || m % 2 === 1)) out.push({ i, label: MONTHS[m - 1] })
  })
  return out
}

export function TrendChart({
  dates, values, valueLabel, band, height = 260, formatValue, formatTick, yDomain, baseline, endLabel, ariaLabel, compact = false,
}: TrendChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const descId = useId()

  // Reset hover when the data changes (category / range switch).
  useEffect(() => setActive(null), [dates, values])

  const m = { top: 10, right: endLabel ? 58 : 12, bottom: 22, left: compact ? 34 : 56 }
  const innerW = Math.max(0, width - m.left - m.right)
  const innerH = height - m.top - m.bottom
  const n = values.length

  const [y0, y1, yTickVals] = useMemo(() => {
    let lo: number, hi: number
    if (yDomain) [lo, hi] = yDomain
    else {
      const all = [...values, ...(band ? [...band.low, ...band.high] : [])].filter(Number.isFinite)
      lo = Math.min(...all)
      hi = Math.max(...all)
      const pad = (hi - lo) * 0.08 || hi * 0.05 || 1
      lo = Math.max(0, lo - pad)
      hi = hi + pad
    }
    const ticks = niceTicks(lo, hi, compact ? 3 : 5)
    return [lo, hi, ticks.filter((t) => t >= lo && t <= hi)]
  }, [values, band, yDomain, compact])

  const x = (i: number) => m.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => m.top + innerH - ((v - y0) / (y1 - y0 || 1)) * innerH

  const linePath = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const bandPath = band
    ? band.high.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('') +
      band.low.map((_, j) => {
        const i = band.low.length - 1 - j
        return `L${x(i).toFixed(1)},${y(band.low[i]).toFixed(1)}`
      }).join('') + 'Z'
    : ''

  const indexAt = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left - m.left
    return Math.max(0, Math.min(n - 1, Math.round((px / (innerW || 1)) * (n - 1))))
  }

  const onPointer = (e: PointerEvent<SVGSVGElement>) => setActive(indexAt(e.clientX, e.currentTarget.getBoundingClientRect()))
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const cur = active ?? n - 1
    let next: number | null = null
    if (e.key === 'ArrowLeft') next = Math.max(0, cur - (e.shiftKey ? 7 : 1))
    else if (e.key === 'ArrowRight') next = Math.min(n - 1, cur + (e.shiftKey ? 7 : 1))
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    else if (e.key === 'Escape') { setActive(null); return }
    if (next != null) { e.preventDefault(); setActive(next) }
  }

  const tickFmt = formatTick ?? formatValue
  const last = n - 1
  const tipLeft = active != null ? x(active) : 0
  const tipOnLeft = tipLeft > width * 0.6

  return (
    <Wrap ref={ref} style={{ height }}>
      {width > 0 && n > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          aria-describedby={descId}
          tabIndex={0}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((a) => a ?? last)}
          onBlur={() => setActive(null)}
          onKeyDown={onKey}
          style={{ touchAction: 'pan-y', color: 'var(--win-link)' }}
        >
          {/* grid + y ticks */}
          {yTickVals.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + innerW} y1={y(t)} y2={y(t)} strokeWidth={1} shapeRendering="crispEdges" style={{ stroke: GRID }} />
              <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} style={{ fill: INK_MUTED, fontVariantNumeric: 'tabular-nums' }}>
                {tickFmt(t)}
              </text>
            </g>
          ))}
          {/* x axis + ticks */}
          <line x1={m.left} x2={m.left + innerW} y1={m.top + innerH} y2={m.top + innerH} strokeWidth={1} shapeRendering="crispEdges" style={{ stroke: AXIS }} />
          {xTicks(dates, compact).map(({ i, label }) => (
            <g key={i}>
              <line x1={x(i)} x2={x(i)} y1={m.top + innerH} y2={m.top + innerH + 4} shapeRendering="crispEdges" style={{ stroke: AXIS }} />
              <text x={x(i)} y={m.top + innerH + 15} textAnchor="middle" fontSize={11} style={{ fill: INK_MUTED }}>{label}</text>
            </g>
          ))}
          {baseline != null && baseline >= y0 && baseline <= y1 && (
            <line x1={m.left} x2={m.left + innerW} y1={y(baseline)} y2={y(baseline)} strokeWidth={1} shapeRendering="crispEdges" style={{ stroke: AXIS }} />
          )}

          {band && <path d={bandPath} fill={SERIES} fillOpacity={0.12} stroke="none" />}
          <path d={linePath} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* end point + direct label */}
          <circle cx={x(last)} cy={y(values[last])} r={4} fill={SERIES} strokeWidth={2} style={{ stroke: SURFACE }} />
          {endLabel && (
            <text x={x(last) + 8} y={y(values[last])} dy="0.32em" fontSize={11} fontWeight={700} style={{ fill: INK }}>{endLabel}</text>
          )}

          {/* crosshair */}
          {active != null && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={m.top} y2={m.top + innerH} strokeWidth={1} shapeRendering="crispEdges" style={{ stroke: INK }} />
              <circle cx={x(active)} cy={y(values[active])} r={4} fill={SERIES} strokeWidth={2} style={{ stroke: SURFACE }} />
            </g>
          )}

          {/* full-plot hit area so the pointer only has to be near a date */}
          <rect x={m.left} y={m.top} width={innerW} height={innerH} fill="transparent" />
        </svg>
      )}

      <span id={descId} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {n > 0 ? `${formatDay(dates[0])} to ${formatDay(dates[last])}. ${valueLabel} went from ${formatValue(values[0])} to ${formatValue(values[last])}. Use left and right arrow keys to read daily values.` : 'No data.'}
      </span>

      {active != null && width > 0 && (
        <Tip
          role="status"
          aria-live="polite"
          style={{
            top: Math.max(0, Math.min(y(values[active]) - 28, height - 70)),
            ...(tipOnLeft ? { right: width - tipLeft + 10 } : { left: tipLeft + 10 }),
          }}
        >
          <div style={{ color: INK_MUTED }}>{formatDay(dates[active])}</div>
          <div>
            <span aria-hidden="true" style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--win-link)', verticalAlign: 'middle', marginRight: 5 }} />
            <strong>{formatValue(values[active])}</strong> <span style={{ color: INK_MUTED }}>{valueLabel}</span>
          </div>
          {band && (
            <div>
              <span aria-hidden="true" style={{ display: 'inline-block', width: 10, height: 8, background: 'var(--win-link)', opacity: 0.18, verticalAlign: 'middle', marginRight: 5 }} />
              <strong>{formatValue(band.low[active])}–{formatValue(band.high[active])}</strong> <span style={{ color: INK_MUTED }}>{band.label}</span>
            </div>
          )}
        </Tip>
      )}
    </Wrap>
  )
}
