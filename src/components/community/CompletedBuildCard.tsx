import styled from 'styled-components'
import type { CommunityBuild } from '@/types/build'
import { Panel, CardTitle, HeadlineParts, StatLine, CompatStat } from '@/components/guides/GuideCard'
import { formatDate, type BuildSummary } from '@/components/guides/buildSummary'

const Byline = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 11px;
  color: var(--win-muted);
  .author { color: var(--win-window-text); font-weight: 700; }
`

const Social = styled.span`
  display: inline-flex;
  gap: 10px;
  margin-left: auto;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`

export function Likes({ n }: { n: number }) {
  return <span aria-label={`${n} likes`} title={`${n} likes`}><span aria-hidden style={{ color: 'var(--win-bad)' }}>♥</span> {n}</span>
}

export function Comments({ n }: { n: number }) {
  return <span aria-label={`${n} comments`} title={`${n} comments`}>{n} comments</span>
}

/** One completed build in the /builds gallery. */
export function CompletedBuildCard({ entry, summary }: { entry: CommunityBuild; summary: BuildSummary }) {
  return (
    <Panel aria-labelledby={`cb-${entry.id}`}>
      <CardTitle id={`cb-${entry.id}`} to={`/builds/${entry.id}`}>{entry.build.name}</CardTitle>
      <Byline>
        <span>by <span className="author">{entry.author}</span></span>
        <time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
        <Social>
          <Likes n={entry.likes} />
          <Comments n={entry.comments} />
        </Social>
      </Byline>
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
