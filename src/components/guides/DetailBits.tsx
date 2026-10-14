import type { ReactNode } from 'react'
import styled from 'styled-components'
import { Toolbar } from 'react95'
import { CompatLevelIcon } from '@/components/build'
import type { BuildSummary } from './buildSummary'

/** Shared layout pieces for /guides/:id and /builds/:id. */

export const DetailToolbar = styled(Toolbar)`
  gap: 6px;
  flex-wrap: wrap;
  justify-content: space-between;
  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
    padding-left: 4px;
    font-size: 12px;
  }
  .actions {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
`

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 12px;
  align-items: start;
  margin-bottom: 12px;
  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

export const Prose = styled.div`
  font-size: 13px;
  line-height: 1.5;
  p { margin: 0 0 8px; max-width: 72ch; }
  p:last-child { margin-bottom: 0; }
  .lede { font-weight: 700; }
`

const Facts = styled.dl`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px 10px;
  margin: 0;
  font-size: 12px;
  dt { color: var(--win-muted); white-space: nowrap; }
  dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
  dd.big { font-size: 16px; font-weight: 700; }
  .compat { display: inline-flex; align-items: center; gap: 4px; justify-content: flex-end; }
`

export interface Fact {
  label: string
  value: ReactNode
  big?: boolean
  title?: string
}

export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <Facts>
      {facts.map((f) => (
        <div key={f.label} style={{ display: 'contents' }}>
          <dt>{f.label}</dt>
          <dd className={f.big ? 'big' : undefined} title={f.title}>{f.value}</dd>
        </div>
      ))}
    </Facts>
  )
}

/** Standard "Total / Est. weight / Parts / Compatibility" facts. */
export function summaryFacts(summary: BuildSummary): Fact[] {
  const compatText = summary.level === 'ok' ? 'No issues' : summary.level === 'warning' ? `${summary.compat.warnings.length} warning${summary.compat.warnings.length === 1 ? '' : 's'}` : summary.level === 'error' ? `${summary.compat.errors.length} problem${summary.compat.errors.length === 1 ? '' : 's'}` : '—'
  return [
    { label: 'Total', value: summary.priceLabel, big: true },
    { label: 'Est. weight', value: summary.weight, title: 'Estimated from claimed part weights' },
    { label: 'Parts', value: summary.partCount },
    {
      label: 'Compatibility',
      title: summary.levelMessage,
      value: (
        <span className="compat">
          <CompatLevelIcon level={summary.level} title={summary.levelMessage} />
          {compatText}
        </span>
      ),
    },
  ]
}

export const RelatedList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12px;
  li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
    border-bottom: 1px solid var(--win-light);
  }
  li:last-child { border-bottom: none; }
  .price { font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
`
