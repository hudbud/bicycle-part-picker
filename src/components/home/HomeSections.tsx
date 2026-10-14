import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Window, WindowHeader, Frame } from 'react95'
import styled from 'styled-components'
import type { BuildGuide, CommunityBuild } from '@/types/build'
import { BROWSABLE_CATEGORIES, CATEGORY_GROUPS, productPath, productsPath } from '@/data/categoryConfig'
import { getPartsByCategory } from '@/data/partsDatabase'
import { getBuildTotals } from '@/data/pricing'
import { estimateWeight } from '@/compat/engine'
import { formatPrice } from '@/utils/format'
import { getPriceDrops, formatPct } from '@/components/trends/priceStats'

/** Classic underlined hyperlink, used for dense link lists. */
export const TextLink = styled(Link)`
  color: var(--win-link);
  text-decoration: underline;
  &:visited { color: var(--win-link); }
  &:hover { color: var(--win-link); }
`

export const SectionWindow = styled(Window)`
  width: 100%;
`

export const SectionHeader = styled(WindowHeader)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const HeaderLink = styled(Link)`
  color: inherit;
  font-size: 12px;
  font-weight: 400;
  text-decoration: underline;
`

export function SectionHead({ title, more }: { title: string; more?: { to: string; label: string } }) {
  return (
    <SectionHeader active>
      <span>{title}</span>
      {more && <HeaderLink to={more.to}>{more.label}</HeaderLink>}
    </SectionHeader>
  )
}

// ---------- Browse by Category ----------

const GroupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 16px;
  @media (max-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const GroupTitle = styled.h3`
  font-size: 12px;
  font-weight: 700;
  margin: 0 0 4px;
  padding-bottom: 2px;
  border-bottom: 1px solid var(--win-shadow);
`

const CatList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12px;
  line-height: 1.7;
`

const Count = styled.span`
  color: var(--win-muted);
  margin-left: 4px;
  font-variant-numeric: tabular-nums;
`

export function CategoryGrid() {
  return (
    <GroupGrid>
      {CATEGORY_GROUPS.map((g) => (
        <section key={g} aria-label={g}>
          <GroupTitle>{g}</GroupTitle>
          <CatList>
            {BROWSABLE_CATEGORIES.filter((c) => c.group === g).map((c) => (
              <li key={c.id}>
                <TextLink to={productsPath(c.id)}>{c.plural}</TextLink>
                <Count>({getPartsByCategory(c.id).length})</Count>
              </li>
            ))}
          </CatList>
        </section>
      ))}
    </GroupGrid>
  )
}

// ---------- Price Drops ----------

const DropList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
`

const DropRow = styled.li`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 8px;
  padding: 5px 6px;
  font-size: 12px;
  & + & { border-top: 1px solid var(--win-light); }
`

const DropName = styled(TextLink)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`

const Pct = styled.span`
  font-weight: 700;
  color: var(--win-ok);
  text-align: right;
  font-variant-numeric: tabular-nums;
`

const Prices = styled.span`
  grid-column: 1 / -1;
  color: var(--win-muted);
  font-variant-numeric: tabular-nums;
`

export function PriceDropsList({ limit = 8 }: { limit?: number }) {
  const drops = useMemo(() => getPriceDrops(30).slice(0, limit), [limit])
  if (drops.length === 0) return <p style={{ fontSize: 12, padding: 6 }}>No price drops in the last 30 days.</p>
  return (
    <Frame variant="field" style={{ width: '100%', background: 'var(--win-window)', color: 'var(--win-window-text)' }}>
      <DropList>
        {drops.map(({ part, was, now, pct }) => (
          <DropRow key={part.id}>
            <DropName to={productPath(part.id)} title={`${part.brand} ${part.name}`}>
              {part.brand} {part.name}
            </DropName>
            <Pct aria-label={`${formatPct(pct, 0)} off`}>{formatPct(pct, 0)}</Pct>
            <Prices>
              <s aria-label={`was ${formatPrice(was)}`}>{formatPrice(was)}</s> → <strong style={{ color: 'var(--win-window-text)' }}>{formatPrice(now)}</strong>
            </Prices>
          </DropRow>
        ))}
      </DropList>
    </Frame>
  )
}

// ---------- Guide & community cards ----------

const CardGrid = styled.div<{ $min: number }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(${({ $min }) => $min}px, 100%), 1fr));
  gap: 10px;
`

export function CardRow({ min = 240, children }: { min?: number; children: React.ReactNode }) {
  return <CardGrid $min={min}>{children}</CardGrid>
}

const Card = styled(Frame).attrs({ variant: 'field' })`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--win-window);
  color: var(--win-window-text);
  font-size: 12px;
  min-width: 0;
`

const CardTitle = styled(TextLink)`
  font-weight: 700;
  font-size: 13px;
`

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  font-variant-numeric: tabular-nums;
`

const Muted = styled.span`
  color: var(--win-muted);
`

const Tier = styled.span`
  display: inline-block;
  padding: 0 4px;
  border: 1px solid var(--win-link);
  color: var(--win-link);
  font-size: 11px;
  font-weight: 700;
`

const Thumb = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border: 1px solid var(--win-shadow);
`

const TIER_LABEL: Record<BuildGuide['tier'], string> = {
  entry: 'Entry level',
  mid: 'Mid-range',
  enthusiast: 'Enthusiast',
  dream: 'Dream build',
}

export function GuideCard({ guide }: { guide: BuildGuide }) {
  const totals = getBuildTotals(guide.build)
  const weight = estimateWeight(guide.build)
  return (
    <Card>
      <div><Tier>{TIER_LABEL[guide.tier] ?? guide.tier}</Tier></div>
      <CardTitle to={`/guides/${guide.id}`}>{guide.title}</CardTitle>
      <p style={{ lineHeight: 1.4, flex: 1 }}>{guide.summary}</p>
      <Meta>
        <strong>{formatPrice(totals.total)}{totals.missingPrices > 0 ? '+' : ''}</strong>
        <Muted title="Estimated weight from claimed part weights">
          {weight.grams > 0 ? `${weight.unknown > 0 ? '≥ ' : ''}${weight.formatted}` : 'Weight n/a'}
        </Muted>
      </Meta>
    </Card>
  )
}

export function CommunityCard({ entry }: { entry: CommunityBuild }) {
  const totals = getBuildTotals(entry.build)
  const parts = entry.build.components.filter((c) => c.part).length
  return (
    <Card>
      {entry.build.photos?.[0]?.url && <Thumb src={entry.build.photos[0].url} alt="" loading="lazy" />}
      <CardTitle to={`/builds/${entry.id}`}>{entry.build.name}</CardTitle>
      <Muted>by {entry.author}</Muted>
      <Meta style={{ marginTop: 'auto' }}>
        <strong>{formatPrice(totals.total)}{totals.missingPrices > 0 ? '+' : ''}</strong>
        <Muted>{parts} parts</Muted>
        <Muted aria-label={`${entry.likes} likes`}>♥ {entry.likes}</Muted>
      </Meta>
    </Card>
  )
}

