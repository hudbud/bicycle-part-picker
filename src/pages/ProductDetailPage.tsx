import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { WindowHeader, WindowContent, Tabs, Tab, TabBody, Button } from 'react95'
import type { Part } from '@/types/parts'
import { defaultQuantity, getCategoryMeta, productsPath } from '@/data/categoryConfig'
import { getPartsByCategory, resolveCategory } from '@/data/partsDatabase'
import { getBestOffer, getOffers, getPartPrice, getPriceHistory, getRating } from '@/data/pricing'
import { formatWeight, summarizeSpecs } from '@/data/specSchema'
import { checkPartAgainstBuild } from '@/compat/engine'
import { useBuildStore } from '@/store/buildStore'
import { usePartsBinStore } from '@/store/partsBinStore'
import { useToast } from '@/hooks/useToast'
import { formatPrice } from '@/utils/format'
import { Stars } from '@/components/ui/Stars'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CompatIcon, SEVERITY_STYLE } from '@/components/ui/CompatIcon'
import { ConditionBadge } from '@/components/tracking/ConditionBadge'
import { PageWindow, Crumbs, NotFoundWindow, TextLink, PartNameLink, PriceCell, Strong, Muted, Box, EraTag } from '@/components/products/ProductBits'
import { SpecTable } from '@/components/products/SpecTable'
import { OffersTable } from '@/components/products/OffersTable'
import { PriceHistoryChart } from '@/components/products/PriceHistoryChart'
import { useAddToBuild, useFindPart, useSlotPartId } from '@/components/products/useAddToBuild'
import { usePartWhereabouts } from '@/components/products/useTracked'
import { buildHasOtherParts, strikeMsrp } from '@/components/products/productUtils'
import { TrackingDialog, type TrackingDialogValue } from '@/components/parts-bin/TrackingDialog'
import { BIN_STATUSES, categoryName } from '@/components/parts-bin/inventory'

const Top = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 12px;
  align-items: start;
  margin-bottom: 12px;

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const TrackBox = styled.div`
  background: var(--win-window);
  color: var(--win-window-text);
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  padding: 10px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const BoxTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: var(--win-link);
  border-bottom: 1px solid var(--win-light);
  padding-bottom: 2px;
`

const Whereabouts = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px 6px;
    line-height: 1.3;
  }
`

const PriceLine = styled.div`
  font-size: 11px;
  color: var(--win-muted);
  line-height: 1.4;
  border-top: 1px solid var(--win-stripe);
  padding-top: 6px;
`

const IssueList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;

  li {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    line-height: 1.35;
  }
`

const SimilarList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--win-window);
  color: var(--win-window-text);
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  font-size: 12px;

  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 10px;
    align-items: center;
    padding: 6px 8px;
    border-bottom: 1px solid var(--win-stripe);
  }
  li:last-child {
    border-bottom: none;
  }
`

const UsedNote = styled.p`
  font-size: 11px;
  margin: 0 0 8px;
  padding: 4px 6px;
  background: var(--win-info);
  color: var(--win-info-text);
  border: 1px solid var(--win-shadow);
  line-height: 1.4;
`

type TabId = 'offers' | 'history'

export function ProductDetailPage() {
  const { partId = '' } = useParams()
  const findPart = useFindPart()
  const part = findPart(partId)
  if (!part) {
    return (
      <NotFoundWindow
        title="Product — Not Found"
        heading="Product not found"
        subtext="It may have been removed from the catalog, or the link is wrong."
        action={<TextLink to="/products">Browse all parts</TextLink>}
      />
    )
  }
  return <ProductView key={part.id} part={part} />
}

function ProductView({ part }: { part: Part }) {
  const meta = getCategoryMeta(part.category)
  const slot = part.category
  const build = useBuildStore((s) => s.build)
  const inBuildId = useSlotPartId(slot)
  const addToBuild = useAddToBuild()
  const addItem = usePartsBinStore((s) => s.addItem)
  const removeItem = usePartsBinStore((s) => s.removeItem)
  const where = usePartWhereabouts(part.id)
  const { success } = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('offers')
  const [haveOpen, setHaveOpen] = useState(false)

  const used = !!part.discontinued
  const offers = getOffers(part)
  const best = getBestOffer(part)
  const price = getPartPrice(part)
  const msrp = strikeMsrp(part)
  const rating = getRating(part)
  const history = useMemo(() => getPriceHistory(part), [part])
  const issues = useMemo(() => checkPartAgainstBuild(part, build, slot), [part, build, slot])
  const hasOthers = buildHasOtherParts(build, slot)

  const similar = useMemo(() => {
    const p0 = price ?? 0
    return getPartsByCategory(resolveCategory(part.category))
      .filter((p) => p.id !== part.id)
      .map((p) => ({ p, d: Math.abs((getPartPrice(p) ?? 0) - p0) + (!!p.discontinued !== !!part.discontinued ? 1e6 : 0) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
      .map(({ p }) => p)
  }, [part, price])

  const summary = summarizeSpecs(part, 4)
  const inBuild = inBuildId === part.id
  const onWishlist = where.bin.some((i) => i.status === 'wanted')
  const tracked = where.bikes.length > 0 || where.bin.length > 0

  const viewBin = { label: 'View bin', onClick: () => navigate('/parts') }

  const want = () => {
    addItem(part, 'wanted')
    const id = usePartsBinStore.getState().items[0]?.id
    success(`${part.brand} ${part.name} added to your wishlist`, id ? { label: 'Undo', onClick: () => removeItem(id) } : viewBin)
  }

  const saveHave = (v: TrackingDialogValue) => {
    addItem(part, v.status ?? 'owned', undefined, { quantity: v.quantity, tracking: v.tracking })
    success(`${part.brand} ${part.name} added to the Parts Bin`, viewBin)
    setHaveOpen(false)
  }

  return (
    <PageWindow>
      <WindowHeader active>
        <span>
          {part.brand} {part.name}
        </span>
      </WindowHeader>
      <WindowContent>
        <Crumbs>
          <Link to="/products">Browse Parts</Link>
          <span className="sep">›</span>
          {meta ? <Link to={productsPath(part.category)}>{meta.plural}</Link> : <span>{part.category}</span>}
          <span className="sep">›</span>
          <span>{part.name}</span>
        </Crumbs>

        <Top>
          <div>
            <div style={{ fontSize: 12, color: 'var(--win-muted)' }}>{part.brand}</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '2px 0 6px', lineHeight: 1.2 }}>{part.name}</h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 12 }}>
              {used && <EraTag part={part} long />}
              {part.weightG != null && <span>Claimed weight: <Strong>{formatWeight(part.weightG)}</Strong></span>}
              {part.year && <span>{used ? 'Year' : 'Model year'} {part.year}</span>}
              {part.isCustom && <Muted>Custom part</Muted>}
              {part.category === 'frame' && (
                <TextLink to={part.isCustom ? `/submit/frame?from=${encodeURIComponent(part.id)}` : `/submit/frame?edit=${encodeURIComponent(part.id)}`}>
                  {part.isCustom ? 'Submit to the catalog' : 'Suggest a correction'}
                </TextLink>
              )}
            </div>
            {summary && <p style={{ fontSize: 12, margin: '8px 0 0' }}>{summary}</p>}

            <Box label="Compatibility with your build" style={{ marginTop: 12 }}>
              {!hasOthers ? (
                <p style={{ fontSize: 12, margin: 0 }}>
                  Your build has no other parts yet — add parts in the <TextLink to="/build">builder</TextLink> to check fit.
                </p>
              ) : issues.length === 0 ? (
                <p style={{ fontSize: 12, margin: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span
                    aria-hidden
                    style={{ display: 'inline-flex', width: 14, height: 14, background: '#008000', color: '#fff', fontSize: 10, alignItems: 'center', justifyContent: 'center', border: '1px solid #000' }}
                  >
                    ✓
                  </span>
                  Compatible with your current build.
                </p>
              ) : (
                <IssueList>
                  {issues.map((i) => (
                    <li key={i.id}>
                      <CompatIcon severity={i.severity} />
                      <span>
                        <Strong>{SEVERITY_STYLE[i.severity].label}:</Strong> {i.message}
                      </span>
                    </li>
                  ))}
                </IssueList>
              )}
            </Box>
          </div>

          <TrackBox aria-label="Track this part">
            {tracked && (
              <>
                <BoxTitle>You track this part</BoxTitle>
                <Whereabouts>
                  {where.bikes.map((b) => (
                    <li key={`${b.bikeId ?? 'current'}:${b.category}`}>
                      <span>On</span>
                      <TextLink to={b.current ? '/build' : `/garage/${b.bikeId}`}>{b.bikeName || 'My Build'}</TextLink>
                      {b.category !== part.category && <Muted>({categoryName(b.category)})</Muted>}
                      {b.status ? <StatusBadge status={b.status} /> : <Muted>planned</Muted>}
                      {b.tracking?.pricePaid != null && <span>paid {formatPrice(b.tracking.pricePaid)}</span>}
                    </li>
                  ))}
                  {where.bin.map((i) => (
                    <li key={i.id}>
                      <TextLink to="/parts">In your bin</TextLink>
                      {(i.quantity ?? 1) > 1 && <span>×{i.quantity}</span>}
                      <StatusBadge status={i.status} />
                      {i.tracking?.condition && <ConditionBadge condition={i.tracking.condition} short />}
                      {i.tracking?.pricePaid != null && <span>paid {formatPrice(i.tracking.pricePaid)}</span>}
                    </li>
                  ))}
                </Whereabouts>
              </>
            )}
            {!tracked && <BoxTitle>Track this part</BoxTitle>}
            {inBuild ? (
              <Button fullWidth disabled>
                ✓ In your build
              </Button>
            ) : (
              <Button fullWidth primary onClick={() => addToBuild(slot, part)} style={{ fontWeight: 700 }}>
                Add to Build
              </Button>
            )}
            <Button fullWidth onClick={() => setHaveOpen(true)} title="Record that you own one: what you paid, condition, where from">
              I have this → Parts Bin
            </Button>
            <Button fullWidth onClick={want} disabled={onWishlist} title="Add to the parts bin as Wanted (your wishlist)">
              {onWishlist ? '✓ On your wishlist' : 'Want it → Parts Bin (wanted)'}
            </Button>
            <PriceLine>
              {used ? (
                <>
                  Typical used value <Strong>{formatPrice(part.price)}</Strong>
                  {best && (
                    <>
                      {' '}· lowest listing {formatPrice(best.total)} on {best.merchant.name}
                    </>
                  )}
                  <br />
                  <Muted>Used-market estimate, not a retail price.</Muted>
                </>
              ) : best ? (
                <>
                  Best price <Strong>{formatPrice(price)}</Strong>
                  {msrp != null && (
                    <>
                      {' '}
                      <s style={{ color: 'var(--win-gray-text)' }}>{formatPrice(msrp)}</s>
                    </>
                  )}{' '}
                  at {best.merchant.name} · {offers.filter((o) => o.inStock).length}/{offers.length} in stock
                </>
              ) : (
                <>
                  {part.isCustom ? 'Your price' : 'MSRP'} <Strong>{formatPrice(price)}</Strong>
                </>
              )}
              {rating && rating.count > 0 && (
                <div style={{ marginTop: 2 }}>
                  <Stars rating={rating} />
                </div>
              )}
            </PriceLine>
          </TrackBox>
        </Top>

        <Box label="Specifications">
          <SpecTable part={part} />
        </Box>

        {!part.isCustom && (
          <Box label={used ? 'Used market (simulated)' : 'Prices & market (simulated)'} style={{ marginTop: 12 }}>
            {used && (
              <UsedNote>
                <Strong>Discontinued — used market.</Strong> This part is no longer made. Listings below are secondhand / NOS
                marketplaces and every price is a used-market estimate; listings come and go.
              </UsedNote>
            )}
            <Tabs value={tab} onChange={(v: TabId) => setTab(v)}>
              <Tab value="offers">{used ? 'Used listings' : 'Retailers'}{offers.length ? ` (${offers.length})` : ''}</Tab>
              <Tab value="history">{used ? 'Used value history' : 'Price history'}</Tab>
            </Tabs>
            <TabBody style={{ padding: 8 }}>
              {tab === 'offers' && <OffersTable offers={offers} />}
              {tab === 'history' && <PriceHistoryChart history={history} />}
            </TabBody>
            <p style={{ fontSize: 11, color: 'var(--win-muted)', margin: '6px 0 0' }}>
              Prices and ratings are simulated for this demo — {used ? 'View' : 'Buy'} opens the {used ? 'marketplace' : 'retailer'}&apos;s search.
            </p>
          </Box>
        )}

        {similar.length > 0 && meta && (
          <section style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>Similar {meta.plural}</h2>
            <SimilarList>
              {similar.map((p) => (
                <li key={p.id}>
                  <span>
                    <PartNameLink part={p} /> {!!p.discontinued !== used && <EraTag part={p} />}
                  </span>
                  <Stars rating={getRating(p)} showCount={false} />
                  <PriceCell part={p} />
                </li>
              ))}
            </SimilarList>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              <TextLink to={productsPath(part.category)}>See all {meta.plural.toLowerCase()} ›</TextLink>
            </div>
          </section>
        )}
      </WindowContent>

      <TrackingDialog
        open={haveOpen}
        onClose={() => setHaveOpen(false)}
        title="I have this — add to Parts Bin"
        subtitle={
          <>
            <Strong>{part.brand}</Strong> {part.name}
            <Muted> · {categoryName(part.category)}</Muted>
            <div style={{ marginTop: 4, color: 'var(--win-muted)' }}>
              Just the basics — what you paid and condition. Everything is optional and editable later in the Parts Bin.
            </div>
          </>
        }
        statusOptions={BIN_STATUSES}
        initial={{
          status: 'owned',
          quantity: defaultQuantity(part.category),
          tracking: { condition: used ? 'used-good' : 'new' },
        }}
        saveLabel="Add to Parts Bin"
        onSave={saveHave}
      />
    </PageWindow>
  )
}
