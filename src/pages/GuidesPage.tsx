import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { WindowHeader, WindowContent } from 'react95'
import type { BuildGuide } from '@/types/build'
import { BUILD_GUIDES, GUIDE_DISCIPLINES, GUIDE_TIERS, guideDiscipline, type GuideDiscipline } from '@/data/guides'
import { PageWindow, Box, Muted, TextLink, Strong } from '@/components/products/ProductBits'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { GuideCard } from '@/components/guides/GuideCard'
import { summarizeBuild } from '@/components/guides/buildSummary'

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 12px;
  margin-bottom: 12px;
  > div { width: 180px; }
  @media (max-width: 767px) {
    > div { flex: 1 1 140px; width: auto; }
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const TIER_RANK = new Map(GUIDE_TIERS.map((t, i) => [t.id, i]))

const DISCIPLINE_OPTIONS = [{ value: '', label: 'All topics' }, ...GUIDE_DISCIPLINES.map((d) => ({ value: d.id, label: d.label }))]
const TIER_OPTIONS = [{ value: '', label: 'All tiers' }, ...GUIDE_TIERS.map((t) => ({ value: t.id, label: t.label }))]

export function GuidesPage() {
  const [params, setParams] = useSearchParams()
  const discipline = (params.get('discipline') ?? '') as GuideDiscipline | ''
  const tier = (params.get('tier') ?? '') as BuildGuide['tier'] | ''

  const setFilter = (key: 'discipline' | 'tier', value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  // Totals/compat are computed live from the catalog once per guide.
  const summaries = useMemo(() => new Map(BUILD_GUIDES.map((g) => [g.id, summarizeBuild(g.build)])), [])

  const sections = useMemo(() => {
    const visible = BUILD_GUIDES.filter(
      (g) => (!discipline || guideDiscipline(g) === discipline) && (!tier || g.tier === tier),
    )
    return GUIDE_DISCIPLINES.map((d) => ({
      ...d,
      guides: visible
        .filter((g) => guideDiscipline(g) === d.id)
        .sort((a, b) => (TIER_RANK.get(a.tier) ?? 0) - (TIER_RANK.get(b.tier) ?? 0)),
    })).filter((s) => s.guides.length > 0)
  }, [discipline, tier])

  const shown = sections.reduce((n, s) => n + s.guides.length, 0)

  return (
    <PageWindow>
      <WindowHeader active>
        <span>Build Guides</span>
      </WindowHeader>
      <WindowContent>
        <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.4 }}>
          Complete, compatibility-checked part lists for every kind of riding — from entry-level to dream builds.
          Prices and weights update live from the catalog. Open any guide and hit <Strong>Use This Build</Strong> to
          start your own from it.
        </p>

        <FilterBar>
          <Select
            label="Topic"
            value={discipline}
            options={DISCIPLINE_OPTIONS}
            onChange={(e) => setFilter('discipline', e.target.value)}
          />
          <Select
            label="Tier"
            value={tier}
            options={TIER_OPTIONS}
            onChange={(e) => setFilter('tier', e.target.value)}
          />
          <Muted style={{ paddingBottom: 6 }}>
            {shown} of {BUILD_GUIDES.length} guides
            {(discipline || tier) && (
              <>
                {' · '}
                <TextLink to="/guides" replace>Clear filters</TextLink>
              </>
            )}
          </Muted>
        </FilterBar>

        {sections.length === 0 ? (
          <EmptyState
            heading="No guides match those filters"
            subtext="Try another tier, or show every discipline."
            action={{ label: 'Clear filters', onClick: () => setParams(new URLSearchParams(), { replace: true }) }}
          />
        ) : (
          <Sections>
            {sections.map((s) => (
              <Box key={s.id} label={`${s.label} · ${s.guides.length} ${s.guides.length === 1 ? 'guide' : 'guides'}`}>
                <Grid>
                  {s.guides.map((g) => (
                    <GuideCard key={g.id} guide={g} summary={summaries.get(g.id)!} />
                  ))}
                </Grid>
              </Box>
            ))}
          </Sections>
        )}
      </WindowContent>
    </PageWindow>
  )
}
