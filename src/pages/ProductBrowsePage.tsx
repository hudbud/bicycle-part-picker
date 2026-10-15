import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { WindowHeader, WindowContent, TextInput, Button, Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell } from 'react95'
import type { Part, PartCategory } from '@/types/parts'
import { getCategoryBySlug, getCategoryMeta } from '@/data/categoryConfig'
import { getPartsByCategory, resolveCategory } from '@/data/partsDatabase'
import { getSpecFields } from '@/data/specSchema'
import { checkPartAgainstBuild, type CompatIssue } from '@/compat/engine'
import { useBuildStore } from '@/store/buildStore'
import { useCustomPartsStore } from '@/store/customPartsStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatPrice } from '@/utils/format'
import { Drawer } from '@/components/ui/Drawer'
import { PartSelectionModal } from '@/components/parts/PartSelectionModal'
import { FilterSidebar } from '@/components/products/FilterSidebar'
import { BrowseTable, MAX_COMPARE } from '@/components/products/BrowseTable'
import { PageWindow, Crumbs, NotFoundWindow, TextLink, Muted, Strong, Box } from '@/components/products/ProductBits'
import { useAddToBuild, useSlotPartId } from '@/components/products/useAddToBuild'
import {
  type BrowseFilters,
  applyFilters,
  buildHasOtherParts,
  chooseTitle,
  emptyFilters,
  filtersFromParams,
  filtersToParams,
  activeFilterCount,
  sortParts,
  matchesQuery,
} from '@/components/products/productUtils'

const Layout = styled.div`
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
`

const CompareBar = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--win-face);
  color: var(--win-text);
  border: 2px solid;
  border-color: var(--win-hilight) var(--win-shadow) var(--win-shadow) var(--win-hilight);
  box-shadow: 0 -2px 0 var(--win-title-solid);
  font-size: 12px;
`

const Empty = styled.div`
  background: var(--win-window);
  color: var(--win-window-text);
  border: 2px inset var(--win-hilight);
  padding: 24px;
  text-align: center;
  font-size: 13px;
`

const SLOT_ALIASES: Partial<Record<PartCategory, PartCategory[]>> = { wheels: ['wheels', 'frontWheel', 'rearWheel'] }

/** `?slot=` is only honoured if it browses the same catalog (e.g. frontWheel on the wheelset page). */
function resolveSlot(category: PartCategory, raw: string | null): PartCategory {
  const allowed = SLOT_ALIASES[category] ?? [category]
  return raw && (allowed as string[]).includes(raw) ? (raw as PartCategory) : category
}

export function ProductBrowsePage() {
  const { slug = '' } = useParams()
  const meta = getCategoryBySlug(slug)
  if (!meta) {
    return (
      <NotFoundWindow
        title="Parts — Not Found"
        heading="Unknown category"
        subtext={`There's no part category called "${slug}".`}
        action={<TextLink to="/products">Browse all parts</TextLink>}
      />
    )
  }
  return <BrowseView key={meta.id} category={meta.id} />
}

function BrowseView({ category }: { category: PartCategory }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const meta = getCategoryMeta(category)!
  const slot = resolveSlot(category, params.get('slot'))
  const slotMeta = getCategoryMeta(slot) ?? meta
  const isMobile = useMediaQuery('(max-width: 767px)')

  const build = useBuildStore((s) => s.build)
  const inBuildId = useSlotPartId(slot)
  const customParts = useCustomPartsStore((s) => s.parts)
  const addToBuild = useAddToBuild()

  const [filters, setFilters] = useState<BrowseFilters>(() => filtersFromParams(params))
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)

  // Mirror filter state into the URL without a router navigation: the app's ErrorBoundary
  // is keyed on location.search, so a router update would remount the page on every keystroke.
  useEffect(() => {
    const next = filtersToParams(filters, new URLSearchParams(window.location.search)).toString()
    if (next !== window.location.search.replace(/^\?/, '')) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${next ? `?${next}` : ''}`)
    }
  }, [filters])

  const allParts = useMemo(() => getPartsByCategory(category), [category])
  const columns = useMemo(() => getSpecFields(category).filter((f) => f.column), [category])

  const compatAvailable = buildHasOtherParts(build, slot)
  const compatOn = compatAvailable && (filters.compat ?? true)

  const issuesById = useMemo(() => {
    const m = new Map<string, CompatIssue[]>()
    if (!compatAvailable) return m
    for (const p of allParts) m.set(p.id, checkPartAgainstBuild(p, build, slot))
    return m
  }, [allParts, build, slot, compatAvailable])

  const { visible, hidden } = useMemo(() => {
    const filtered = applyFilters(allParts, filters, category)
    const compatible = compatOn ? filtered.filter((p) => !(issuesById.get(p.id) ?? []).some((i) => i.severity === 'error')) : filtered
    return { visible: sortParts(compatible, filters.sort, filters.dir, category), hidden: filtered.length - compatible.length }
  }, [allParts, filters, category, compatOn, issuesById])

  const issuesFor = useCallback(
    (p: Part) => {
      const issues = issuesById.get(p.id) ?? []
      return compatOn ? issues.filter((i) => i.severity !== 'error') : issues
    },
    [issuesById, compatOn],
  )

  const myCustom = useMemo(
    () => customParts.filter((p) => resolveCategory(p.category) === category && matchesQuery(p, filters.q)),
    [customParts, category, filters.q],
  )

  const onSort = (key: string) =>
    setFilters((f) => ({ ...f, sort: key, dir: f.sort === key ? (f.dir === 'asc' ? 'desc' : 'asc') : key === 'rating' ? 'desc' : 'asc' }))

  const onToggleCompare = (id: string) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= MAX_COMPARE ? ids : [...ids, id]))

  const resetFilters = () => setFilters((f) => ({ ...emptyFilters(f.q), compat: f.compat, sort: f.sort, dir: f.dir }))

  const sidebar = (
    <FilterSidebar
      category={category}
      parts={allParts}
      filters={filters}
      onChange={setFilters}
      onReset={resetFilters}
      compat={{ enabled: compatOn, hidden, available: compatAvailable }}
      onToggleCompat={(on) => setFilters((f) => ({ ...f, compat: on }))}
    />
  )

  const countLabel = `${visible.length} ${compatOn ? 'Compatible ' : ''}Part${visible.length === 1 ? '' : 's'}`
  const nActive = activeFilterCount(filters)

  return (
    <PageWindow>
      <WindowHeader active>
        <span>{chooseTitle(slot)}</span>
      </WindowHeader>
      <WindowContent style={{ padding: isMobile ? 8 : undefined }}>
        <Crumbs>
          <Link to="/products">Browse Parts</Link>
          <span className="sep">›</span>
          <span>{meta.plural}</span>
          {slot !== category && (
            <>
              <span className="sep">·</span>
              <span>
                filling your <Strong>{slotMeta.label}</Strong> slot
              </span>
            </>
          )}
        </Crumbs>
        <p style={{ fontSize: 12, margin: '0 0 10px', color: 'var(--win-muted)' }}>{meta.blurb}</p>

        <Layout style={isMobile ? { gridTemplateColumns: 'minmax(0, 1fr)' } : undefined}>
          {!isMobile && <aside aria-label="Filters">{sidebar}</aside>}

          <section aria-label={`${meta.plural} results`}>
            <Toolbar>
              {isMobile && (
                <Button onClick={() => setDrawerOpen(true)}>Filters{nActive ? ` (${nActive})` : ''}</Button>
              )}
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <TextInput
                  value={filters.q}
                  placeholder={`Search ${meta.plural.toLowerCase()}…`}
                  aria-label={`Search ${meta.plural}`}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((f) => ({ ...f, q: e.target.value }))}
                  fullWidth
                />
              </div>
              <Button onClick={() => setCustomOpen(true)}>Add a custom part…</Button>
              {category === 'frame' && <Button onClick={() => navigate('/submit/frame')}>Submit a frame…</Button>}
            </Toolbar>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
              <Strong style={{ fontSize: 14 }}>{countLabel}</Strong>
              {compatOn && hidden > 0 && <Muted>{hidden} incompatible hidden</Muted>}
            </div>

            {visible.length > 0 ? (
              <BrowseTable
                mobile={isMobile}
                parts={visible}
                columns={columns}
                issuesFor={issuesFor}
                sort={filters.sort}
                dir={filters.dir}
                onSort={onSort}
                compareIds={compareIds}
                onToggleCompare={onToggleCompare}
                inBuildId={inBuildId}
                onAdd={(p) => addToBuild(slot, p)}
              />
            ) : (
              <Empty>
                <p style={{ fontWeight: 700, margin: '0 0 6px' }}>
                  {allParts.length === 0 ? `No ${meta.plural.toLowerCase()} in the catalog yet.` : 'No parts match these filters.'}
                </p>
                {allParts.length > 0 ? (
                  <Button onClick={() => setFilters((f) => ({ ...emptyFilters(), compat: f.compat }))}>
                    Clear search &amp; filters
                  </Button>
                ) : (
                  <Button onClick={() => setCustomOpen(true)}>Add a custom part…</Button>
                )}
                {category === 'frame' && (
                  <p style={{ fontSize: 12, margin: '10px 0 0' }}>
                    Missing from the catalog?{' '}
                    <TextLink to={`/submit/frame${filters.q.trim() ? `?name=${encodeURIComponent(filters.q.trim())}` : ''}`}>Add the frame</TextLink>{' '}
                    so everyone can use it.
                  </p>
                )}
              </Empty>
            )}

            {compareIds.length > 0 && (
              <CompareBar>
                <span>
                  {compareIds.length} of {MAX_COMPARE} selected{compareIds.length < 2 ? ' — pick at least 2' : ''}
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" onClick={() => setCompareIds([])}>
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    primary
                    disabled={compareIds.length < 2}
                    onClick={() => navigate(`/compare?ids=${compareIds.map(encodeURIComponent).join(',')}`)}
                    style={{ fontWeight: 700 }}
                  >
                    Compare ({compareIds.length})
                  </Button>
                </span>
              </CompareBar>
            )}

            {myCustom.length > 0 && (
              <Box label={`Your custom ${meta.plural.toLowerCase()}`} style={{ marginTop: 14 }}>
                <Table style={{ width: '100%', fontSize: 12 }}>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Name</TableHeadCell>
                      <TableHeadCell style={{ textAlign: 'right', width: 90 }}>Price</TableHeadCell>
                      <TableHeadCell style={{ width: 70 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myCustom.map((p) => (
                      <TableRow key={p.id}>
                        <TableDataCell style={{ padding: '4px 6px' }}>
                          <Strong>{p.brand}</Strong> {p.name}
                          {p.url && (
                            <>
                              {' '}
                              <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--win-link)', fontSize: 11 }}>
                                link
                              </a>
                            </>
                          )}
                        </TableDataCell>
                        <TableDataCell style={{ textAlign: 'right', padding: '4px 6px' }}>{formatPrice(p.price)}</TableDataCell>
                        <TableDataCell style={{ textAlign: 'center', padding: '4px 6px' }}>
                          {inBuildId === p.id ? (
                            <span style={{ fontSize: 11, fontWeight: 700 }}>In build</span>
                          ) : (
                            <Button size="sm" onClick={() => addToBuild(slot, p)}>
                              Add
                            </Button>
                          )}
                        </TableDataCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

          </section>
        </Layout>
      </WindowContent>

      {isMobile && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Filter ${meta.plural}`}>
          {sidebar}
          <Button fullWidth style={{ marginTop: 10, fontWeight: 700 }} onClick={() => setDrawerOpen(false)}>
            Show {countLabel.toLowerCase()}
          </Button>
        </Drawer>
      )}

      {customOpen && (
        <PartSelectionModal
          open
          onClose={() => setCustomOpen(false)}
          category={slot}
          categoryLabel={slotMeta.label}
          onSelect={(p) => addToBuild(slot, p)}
        />
      )}
    </PageWindow>
  )
}
