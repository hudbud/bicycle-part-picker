import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { WindowHeader, WindowContent } from 'react95'
import { BUILD_GUIDES, GUIDE_DISCIPLINES, getGuide, guideDiscipline, tierLabel } from '@/data/guides'
import { BuildPartList } from '@/components/build'
import { PageWindow, Box, Strong, Crumbs, TextLink, Muted } from '@/components/products/ProductBits'
import { EmptyState } from '@/components/ui/EmptyState'
import { TierBadge } from '@/components/guides/GuideCard'
import { UseBuildActions } from '@/components/guides/UseBuildActions'
import { DetailToolbar, DetailGrid, Prose, FactList, summaryFacts, RelatedList } from '@/components/guides/DetailBits'
import { summarizeBuild, paragraphs } from '@/components/guides/buildSummary'

export function GuideDetailPage() {
  const { guideId } = useParams()
  const navigate = useNavigate()
  const guide = guideId ? getGuide(guideId) : undefined
  const summary = useMemo(() => (guide ? summarizeBuild(guide.build) : undefined), [guide])

  if (!guide || !summary) {
    return (
      <PageWindow style={{ maxWidth: 640 }}>
        <WindowHeader active><span>Build Guide Not Found</span></WindowHeader>
        <WindowContent>
          <EmptyState
            heading="We couldn't find that build guide"
            subtext="It may have been renamed or retired. Browse the current guides instead."
            action={{ label: 'Browse Build Guides', onClick: () => navigate('/guides') }}
          />
        </WindowContent>
      </PageWindow>
    )
  }

  const discipline = guideDiscipline(guide)
  const disciplineLabel = GUIDE_DISCIPLINES.find((d) => d.id === discipline)?.label ?? discipline
  const related = BUILD_GUIDES.filter((g) => g.id !== guide.id && guideDiscipline(g) === discipline)
  const facts = [
    { label: 'Tier', value: tierLabel(guide.tier) },
    { label: 'Discipline', value: disciplineLabel },
    ...summaryFacts(summary),
  ]

  return (
    <PageWindow style={{ maxWidth: 1100 }}>
      <WindowHeader active>
        <span>Build Guide — {guide.title}</span>
      </WindowHeader>
      <DetailToolbar>
        <div className="title">
          <Strong style={{ fontSize: 14 }}>{guide.title}</Strong>
          <TierBadge tier={guide.tier} />
        </div>
        <div className="actions">
          <UseBuildActions build={guide.build} label="guide" />
        </div>
      </DetailToolbar>

      <WindowContent>
        <Crumbs aria-label="Breadcrumb">
          <Link to="/guides">Build Guides</Link>
          <span className="sep">›</span>
          <Link to={`/guides?discipline=${discipline}`}>{disciplineLabel}</Link>
          <span className="sep">›</span>
          <span>{guide.title}</span>
        </Crumbs>

        <DetailGrid>
          <Box label="About This Build">
            <Prose>
              <p className="lede">{guide.summary}</p>
              {paragraphs(guide.body).map((p, i) => <p key={i}>{p}</p>)}
            </Prose>
          </Box>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Box label="At a Glance">
              <FactList facts={facts} />
            </Box>
            {related.length > 0 && (
              <Box label={`More ${disciplineLabel} Guides`}>
                <RelatedList>
                  {related.map((g) => (
                    <li key={g.id}>
                      <TextLink to={`/guides/${g.id}`}>{g.title}</TextLink>
                      <span className="price">{summarizeBuild(g.build).priceLabel}</span>
                    </li>
                  ))}
                </RelatedList>
              </Box>
            )}
          </div>
        </DetailGrid>

        <BuildPartList build={guide.build} />
        <Muted style={{ display: 'block', marginTop: 8 }}>
          Prices are the best current offer for each part; weights are manufacturer claims. Copying the guide gives you an
          editable build — nothing here changes.
        </Muted>
      </WindowContent>
    </PageWindow>
  )
}
