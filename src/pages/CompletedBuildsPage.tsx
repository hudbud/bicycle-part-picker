import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { WindowHeader, WindowContent } from 'react95'
import { COMMUNITY_BUILDS } from '@/data/communityBuilds'
import { PageWindow, Muted, TextLink } from '@/components/products/ProductBits'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { CompletedBuildCard } from '@/components/community/CompletedBuildCard'
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

const Gallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 8px;
  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

type SortKey = 'newest' | 'liked' | 'price-asc' | 'price-desc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'liked', label: 'Most liked' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
]

const PRICE_RANGES: { value: string; label: string; min: number; max: number }[] = [
  { value: 'u2000', label: 'Under $2,000', min: 0, max: 2000 },
  { value: '2000-5000', label: '$2,000 – $5,000', min: 2000, max: 5000 },
  { value: '5000-8000', label: '$5,000 – $8,000', min: 5000, max: 8000 },
  { value: 'o8000', label: '$8,000 and up', min: 8000, max: Infinity },
]

export function CompletedBuildsPage() {
  const [params, setParams] = useSearchParams()
  const sort = (SORT_OPTIONS.some((o) => o.value === params.get('sort')) ? params.get('sort') : 'newest') as SortKey
  const price = params.get('price') ?? ''

  const set = (key: string, value: string, fallback = '') => {
    const next = new URLSearchParams(params)
    if (value && value !== fallback) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const rows = useMemo(() => COMMUNITY_BUILDS.map((entry) => ({ entry, summary: summarizeBuild(entry.build) })), [])

  const visible = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.value === price)
    const out = rows.filter((r) => !range || (r.summary.totals.total >= range.min && r.summary.totals.total < range.max))
    const byDate = (a: (typeof rows)[number], b: (typeof rows)[number]) => b.entry.publishedAt.localeCompare(a.entry.publishedAt)
    out.sort((a, b) => {
      switch (sort) {
        case 'liked': return b.entry.likes - a.entry.likes || byDate(a, b)
        case 'price-asc': return a.summary.totals.total - b.summary.totals.total
        case 'price-desc': return b.summary.totals.total - a.summary.totals.total
        default: return byDate(a, b)
      }
    })
    return out
  }, [rows, sort, price])

  const filtered = Boolean(price)

  return (
    <PageWindow>
      <WindowHeader active>
        <span>Completed Builds</span>
      </WindowHeader>
      <WindowContent>
        <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.4 }}>
          Real-world bikes put together by riders, with their part lists, prices and stories. Every list is
          checked for compatibility against the current catalog.
        </p>

        <FilterBar>
          <Select label="Sort by" value={sort} options={SORT_OPTIONS} onChange={(e) => set('sort', e.target.value, 'newest')} />
          <Select
            label="Price"
            value={price}
            options={[{ value: '', label: 'Any price' }, ...PRICE_RANGES.map(({ value, label }) => ({ value, label }))]}
            onChange={(e) => set('price', e.target.value)}
          />
          <Muted style={{ paddingBottom: 6 }}>
            {visible.length} of {COMMUNITY_BUILDS.length} builds
            {filtered && (
              <>
                {' · '}
                <TextLink to={sort === 'newest' ? '/builds' : `/builds?sort=${sort}`} replace>Clear filters</TextLink>
              </>
            )}
          </Muted>
        </FilterBar>

        {visible.length === 0 ? (
          <EmptyState
            heading="No builds match those filters"
            subtext="Try a wider price range."
            action={{ label: 'Clear filters', onClick: () => setParams(sort === 'newest' ? {} : { sort }, { replace: true }) }}
          />
        ) : (
          <Gallery>
            {visible.map(({ entry, summary }) => (
              <CompletedBuildCard key={entry.id} entry={entry} summary={summary} />
            ))}
          </Gallery>
        )}
      </WindowContent>
    </PageWindow>
  )
}
