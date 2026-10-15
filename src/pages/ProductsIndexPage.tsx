import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { WindowHeader, WindowContent, TextInput, Table, TableHead, TableBody, TableRow, TableHeadCell, TableDataCell } from 'react95'
import { BROWSABLE_CATEGORIES, CATEGORY_GROUPS, getCategoryMeta, productsPath } from '@/data/categoryConfig'
import { ALL_PARTS, getPartsByCategory } from '@/data/partsDatabase'
import { getBestOffer } from '@/data/pricing'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { PageWindow, PartNameLink, Box, Muted, TextLink, PriceCell, EraTag, HaveTag } from '@/components/products/ProductBits'
import { useHavePartIds } from '@/components/products/useTracked'
import { matchesQuery } from '@/components/products/productUtils'

const Groups = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;
  align-items: start;

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const CatList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--win-window);
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);

  li {
    border-bottom: 1px solid var(--win-stripe);
  }
  li:last-child {
    border-bottom: none;
  }
  a {
    display: block;
    padding: 6px 8px;
    color: var(--win-window-text);
    text-decoration: none;
    font-size: 12px;
    line-height: 1.35;
  }
  a:hover,
  a:focus-visible {
    background: var(--win-select);
    color: var(--win-select-text);
    outline: none;
  }
  a:hover .blurb,
  a:focus-visible .blurb {
    color: var(--win-select-text);
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .name {
    font-weight: 700;
    text-decoration: underline;
  }
  .blurb {
    display: block;
    color: var(--win-muted);
    font-size: 11px;
    margin-top: 2px;
  }
`

const RESULT_LIMIT = 50

function searchLabel(n: number) {
  return n >= 100 ? `Search ${Math.floor(n / 100) * 100}+ parts` : `Search ${n} parts`
}

export function ProductsIndexPage() {
  const [q, setQ] = useState('')
  const isMobile = useMediaQuery('(max-width: 767px)')
  const have = useHavePartIds()

  const results = useMemo(() => (q.trim().length < 2 ? [] : ALL_PARTS.filter((p) => matchesQuery(p, q))), [q])

  return (
    <PageWindow>
      <WindowHeader active>
        <span>Browse Parts</span>
      </WindowHeader>
      <WindowContent>
        <div style={{ marginBottom: 12 }}>
          <TextInput
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
            placeholder={isMobile ? `${searchLabel(ALL_PARTS.length)}…` : `${searchLabel(ALL_PARTS.length)} — try "Ultegra", "carbon" or "Fox"`}
            aria-label={searchLabel(ALL_PARTS.length)}
            fullWidth
          />
        </div>

        {q.trim().length >= 2 && (
          <Box label={`${results.length} result${results.length === 1 ? '' : 's'} for “${q.trim()}”`} style={{ marginBottom: 14 }}>
            {results.length === 0 ? (
              <p style={{ fontSize: 12, margin: 0 }}>No parts match. Try a brand or model name.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table style={{ width: '100%', fontSize: 12 }}>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Name</TableHeadCell>
                      {!isMobile && <TableHeadCell>Category</TableHeadCell>}
                      {!isMobile && <TableHeadCell>Best offer at</TableHeadCell>}
                      <TableHeadCell style={{ textAlign: 'right' }}>Price</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.slice(0, RESULT_LIMIT).map((p) => {
                      const meta = getCategoryMeta(p.category)
                      return (
                        <TableRow key={p.id} style={{ height: 'auto', lineHeight: 1.3 }}>
                          <TableDataCell style={{ padding: '5px 8px' }}>
                            <PartNameLink part={p} /> <EraTag part={p} />
                            {have.has(p.id) && (
                              <>
                                {' '}
                                <HaveTag />
                              </>
                            )}
                            {isMobile && meta && <Muted style={{ display: 'block' }}>{meta.label}</Muted>}
                          </TableDataCell>
                          {!isMobile && (
                            <TableDataCell style={{ padding: '5px 8px' }}>
                              {meta ? <TextLink to={productsPath(p.category)}>{meta.label}</TextLink> : p.category}
                            </TableDataCell>
                          )}
                          {!isMobile && <TableDataCell style={{ padding: '5px 8px' }}>{getBestOffer(p)?.merchant.name ?? '—'}</TableDataCell>}
                          <TableDataCell style={{ padding: '5px 8px', textAlign: 'right' }}>
                            <PriceCell part={p} />
                          </TableDataCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {results.length > RESULT_LIMIT && (
                  <Muted style={{ display: 'block', marginTop: 6 }}>
                    Showing the first {RESULT_LIMIT} — narrow your search or open a category below.
                  </Muted>
                )}
              </div>
            )}
          </Box>
        )}

        <Groups>
          {CATEGORY_GROUPS.map((group) => {
            const cats = BROWSABLE_CATEGORIES.filter((c) => c.group === group)
            if (cats.length === 0) return null
            return (
              <Box key={group} label={group}>
                <CatList>
                  {cats.map((c) => {
                    const n = getPartsByCategory(c.id).length
                    return (
                      <li key={c.id}>
                        <Link to={productsPath(c.id)}>
                          <span className="row">
                            <span className="name">{c.plural}</span>
                            <span>
                              {n} part{n === 1 ? '' : 's'}
                            </span>
                          </span>
                          <span className="blurb">{c.blurb}</span>
                        </Link>
                      </li>
                    )
                  })}
                </CatList>
              </Box>
            )
          })}
        </Groups>
      </WindowContent>
    </PageWindow>
  )
}
