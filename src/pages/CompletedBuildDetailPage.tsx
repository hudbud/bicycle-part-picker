import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { WindowHeader, WindowContent } from 'react95'
import { COMMUNITY_BUILDS, getCommunityBuild } from '@/data/communityBuilds'
import { formatWeight } from '@/data/specSchema'
import { BuildPartList } from '@/components/build'
import { PageWindow, Box, Strong, Crumbs, TextLink, Muted } from '@/components/products/ProductBits'
import { EmptyState } from '@/components/ui/EmptyState'
import { UseBuildActions } from '@/components/guides/UseBuildActions'
import { DetailToolbar, DetailGrid, Prose, FactList, summaryFacts, RelatedList, type Fact } from '@/components/guides/DetailBits'
import { summarizeBuild, paragraphs, formatDate } from '@/components/guides/buildSummary'
import { Likes, Comments } from '@/components/community/CompletedBuildCard'

function weightDelta(actual: number, estimated: number): string {
  const d = Math.round(actual - estimated)
  if (Math.abs(d) < 5) return 'matches the estimate'
  return `${d > 0 ? '+' : '−'}${formatWeight(Math.abs(d))} vs estimate`
}

export function CompletedBuildDetailPage() {
  const { buildId } = useParams()
  const navigate = useNavigate()
  const entry = buildId ? getCommunityBuild(buildId) : undefined
  const summary = useMemo(() => (entry ? summarizeBuild(entry.build) : undefined), [entry])

  if (!entry || !summary) {
    return (
      <PageWindow style={{ maxWidth: 640 }}>
        <WindowHeader active><span>Build Not Found</span></WindowHeader>
        <WindowContent>
          <EmptyState
            heading="We couldn't find that completed build"
            subtext="The link may be out of date. Have a look through the other builds instead."
            action={{ label: 'Browse Completed Builds', onClick: () => navigate('/builds') }}
          />
        </WindowContent>
      </PageWindow>
    )
  }

  const { build } = entry
  const estimatedG = summary.compat.weight.grams
  const facts: Fact[] = [
    { label: 'Builder', value: entry.author },
    { label: 'Published', value: formatDate(entry.publishedAt, 'long') },
    ...summaryFacts(summary),
  ]
  if (entry.actualWeightG) {
    // Swap the estimated weight row for an "Actual vs Estimated" pair.
    const i = facts.findIndex((f) => f.label === 'Est. weight')
    facts.splice(
      i,
      1,
      { label: 'Actual weight', value: <Strong>{formatWeight(entry.actualWeightG)}</Strong>, title: 'Weighed by the builder' },
      {
        label: 'Estimated',
        value: estimatedG > 0 ? <span>{summary.weight} <Muted>({weightDelta(entry.actualWeightG, estimatedG)})</Muted></span> : '—',
        title: 'Estimated from claimed part weights',
      },
    )
  }
  facts.push({ label: 'Likes', value: <Likes n={entry.likes} /> }, { label: 'Comments', value: entry.comments })

  const more = COMMUNITY_BUILDS.filter((b) => b.id !== entry.id)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 4)

  return (
    <PageWindow style={{ maxWidth: 1100 }}>
      <WindowHeader active>
        <span>Completed Build — {build.name}</span>
      </WindowHeader>
      <DetailToolbar>
        <div className="title">
          <Strong style={{ fontSize: 14 }}>{build.name}</Strong>
          <span>by <Strong>{entry.author}</Strong></span>
          <Muted><time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time></Muted>
          <Muted style={{ display: 'inline-flex', gap: 10 }}>
            <Likes n={entry.likes} />
            <Comments n={entry.comments} />
          </Muted>
        </div>
        <div className="actions">
          <UseBuildActions build={build} />
        </div>
      </DetailToolbar>

      <WindowContent>
        <Crumbs aria-label="Breadcrumb">
          <Link to="/builds">Completed Builds</Link>
          <span className="sep">›</span>
          <span>{build.name}</span>
        </Crumbs>

        <DetailGrid>
          <Box label="The Build">
            <Prose>
              {build.description && <p className="lede">{build.description}</p>}
              {paragraphs(entry.story).map((p, i) => <p key={i}>{p}</p>)}
            </Prose>
          </Box>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Box label="Build Details">
              <FactList facts={facts} />
            </Box>
            <Box label="More Completed Builds">
              <RelatedList>
                {more.map((b) => (
                  <li key={b.id}>
                    <TextLink to={`/builds/${b.id}`}>{b.build.name}</TextLink>
                    <span className="price">{summarizeBuild(b.build).priceLabel}</span>
                  </li>
                ))}
              </RelatedList>
            </Box>
          </div>
        </DetailGrid>

        <BuildPartList build={build} />
      </WindowContent>
    </PageWindow>
  )
}
