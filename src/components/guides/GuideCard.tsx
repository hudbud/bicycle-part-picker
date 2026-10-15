import { Link } from 'react-router-dom'
import styled from 'styled-components'
import type { BuildGuide } from '@/types/build'
import { tierLabel } from '@/data/guides'
import { CompatLevelIcon } from '@/components/build'
import type { BuildSummary } from './buildSummary'

/** White sunken panel, like the rest of the app's lists. */
export const Panel = styled.article`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 8px 10px;
  background: var(--win-window);
  color: var(--win-window-text);
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  box-shadow: inset 1px 1px 0 var(--win-dkshadow);
  font-size: 12px;
`

export const CardTitle = styled(Link)`
  font-size: 14px;
  font-weight: 700;
  color: var(--win-link);
  text-decoration: underline;
  line-height: 1.25;
  &:hover { color: var(--win-link); }
`

const TIER_COLORS: Record<BuildGuide['tier'], { bg: string; fg: string }> = {
  entry: { bg: '#e6f2e6', fg: '#005000' },
  mid: { bg: '#e6ecf8', fg: '#000080' },
  enthusiast: { bg: '#f6ecdc', fg: '#6b3c00' },
  dream: { bg: '#f1e6f6', fg: '#5a0070' },
}

const TierTag = styled.span<{ $tier: BuildGuide['tier'] }>`
  display: inline-block;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid currentColor;
  color: ${(p) => TIER_COLORS[p.$tier].fg};
  background: ${(p) => TIER_COLORS[p.$tier].bg};
  white-space: nowrap;
`

export function TierBadge({ tier }: { tier: BuildGuide['tier'] }) {
  return <TierTag $tier={tier}>{tierLabel(tier)}</TierTag>
}

/** Frame / Groupset / Wheels mini spec list. */
export const Headline = styled.dl`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1px 8px;
  margin: 0;
  font-size: 11px;
  dt { color: var(--win-muted); }
  dd {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

export const StatLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px solid var(--win-light);
  font-size: 11px;
  color: var(--win-muted);
  .price {
    font-size: 14px;
    font-weight: 700;
    color: var(--win-window-text);
    font-variant-numeric: tabular-nums;
  }
  .compat {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
`

export function HeadlineParts({ summary }: { summary: BuildSummary }) {
  return (
    <Headline>
      {summary.frame && (<><dt>Frame</dt><dd title={summary.frame}>{summary.frame}</dd></>)}
      {summary.groupset && (<><dt>Groupset</dt><dd title={summary.groupset}>{summary.groupset}</dd></>)}
      {summary.wheels && (<><dt>Wheels</dt><dd title={summary.wheels}>{summary.wheels}</dd></>)}
    </Headline>
  )
}

export function CompatStat({ summary }: { summary: BuildSummary }) {
  const short = summary.level === 'ok' ? 'Compatible' : summary.level === 'warning' ? 'Warnings' : summary.level === 'error' ? 'Problems' : 'Empty'
  return (
    <span className="compat" title={summary.levelMessage}>
      <CompatLevelIcon level={summary.level} title={summary.levelMessage} />
      {short}
    </span>
  )
}

export function GuideCard({ guide, summary }: { guide: BuildGuide; summary: BuildSummary }) {
  return (
    <Panel aria-labelledby={`guide-${guide.id}`}>
      <div><TierBadge tier={guide.tier} /></div>
      <CardTitle id={`guide-${guide.id}`} to={`/guides/${guide.id}`}>{guide.title}</CardTitle>
      <p style={{ margin: 0, lineHeight: 1.4 }}>{guide.summary}</p>
      <HeadlineParts summary={summary} />
      <StatLine>
        <span className="price">{summary.priceLabel}</span>
        <span title="Estimated from claimed part weights">{summary.weight}</span>
        <span>{summary.partCount} parts</span>
        <CompatStat summary={summary} />
      </StatLine>
    </Panel>
  )
}
