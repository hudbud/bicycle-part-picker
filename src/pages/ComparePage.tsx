import { useMemo, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { WindowHeader, WindowContent, Button } from 'react95'
import type { Part } from '@/types/parts'
import { getCategoryLabel, getCategoryMeta, productsPath } from '@/data/categoryConfig'
import { getSpecFields, getSpecValue, formatSpecValue, formatWeight, type SpecField } from '@/data/specSchema'
import { getBestOffer, getRating } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { Stars } from '@/components/ui/Stars'
import { useBuildStore } from '@/store/buildStore'
import { PageWindow, NotFoundWindow, TextLink, PartNameLink, PriceCell, Strong, Muted, Crumbs, EraTag, HaveTag } from '@/components/products/ProductBits'
import { useHavePartIds } from '@/components/products/useTracked'
import { useAddToBuild, useFindPart } from '@/components/products/useAddToBuild'

const Scroll = styled.div`
  overflow-x: auto;
  background: var(--win-window);
  color: var(--win-window-text);
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
`

const T = styled.table`
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;

  th,
  td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--win-stripe);
    border-right: 1px solid var(--win-stripe);
    text-align: left;
    vertical-align: top;
  }
  th[scope='row'] {
    position: sticky;
    left: 0;
    z-index: 1;
    width: 150px;
    min-width: 120px;
    background: var(--win-stripe);
    font-weight: 700;
  }
  thead th {
    background: var(--win-face);
    color: var(--win-text);
    vertical-align: bottom;
    min-width: 170px;
    border-bottom: 2px solid var(--win-shadow);
    font-weight: 400;
  }
  thead th:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
  }
  @media (max-width: 767px) {
    th[scope='row'] {
      width: 96px;
      min-width: 96px;
    }
    thead th {
      min-width: 150px;
    }
  }
  tr.diff td {
    background: var(--win-select-soft);
    color: var(--win-window-text);
  }
  tr.diff th[scope='row'] {
    background: var(--win-select-soft);
    color: var(--win-window-text);
  }
`

const ColHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  line-height: 1.3;
`

const RemoveBtn = styled(Button)`
  min-width: 0;
  width: 22px;
  height: 20px;
  padding: 0;
  font-size: 11px;
  flex-shrink: 0;
`

interface Row {
  key: string
  label: string
  /** Comparable text per column; rows whose values differ get highlighted. */
  values: string[]
  render?: (p: Part, i: number) => ReactNode
}

export function ComparePage() {
  const [params, setParams] = useSearchParams()
  const findPart = useFindPart()
  const addToBuild = useAddToBuild()
  const build = useBuildStore((s) => s.build)
  const have = useHavePartIds()

  const ids = useMemo(
    () => [...new Set((params.get('ids') ?? '').split(',').map((s) => s.trim()).filter(Boolean))],
    [params],
  )
  const parts = useMemo(() => ids.map(findPart).filter((p): p is Part => !!p), [ids, findPart])

  const rows = useMemo<Row[]>(() => {
    const fields: SpecField[] = []
    for (const p of parts) {
      for (const f of getSpecFields(p.category)) {
        if (f.key !== 'weightG' && !fields.some((x) => x.key === f.key)) fields.push(f)
      }
    }
    const mixed = new Set(parts.map((p) => p.category)).size > 1
    const best = parts.map((p) => getBestOffer(p))
    return [
      ...(mixed ? [{ key: 'category', label: 'Category', values: parts.map((p) => getCategoryLabel(p.category) ?? p.category) }] : []),
      { key: 'brand', label: 'Manufacturer', values: parts.map((p) => p.brand) },
      ...(parts.some((p) => p.discontinued)
        ? [{ key: 'era', label: 'Era', values: parts.map((p) => (p.discontinued ? 'Discontinued — used market' : 'Current production')) }]
        : []),
      { key: 'weight', label: 'Weight', values: parts.map((p) => formatWeight(p.weightG)) },
      ...fields.map((f) => ({ key: f.key, label: f.label, values: parts.map((p) => formatSpecValue(f, getSpecValue(p, f.key))) })),
      {
        key: 'price',
        label: parts.some((p) => p.discontinued) ? 'Price (used = market estimate)' : 'Price',
        values: parts.map((p) => String(getBestOffer(p)?.total ?? p.price ?? '')),
        render: (p) => <PriceCell part={p} align="left" />,
      },
      {
        key: 'rating',
        label: 'Rating',
        values: parts.map((p) => {
          const r = getRating(p)
          return r ? `${r.avg}/${r.count}` : ''
        }),
        render: (p) => <Stars rating={getRating(p)} />,
      },
      {
        key: 'retailer',
        label: 'Best Offer',
        values: best.map((o) => (o ? `${o.merchant.name} ${o.total}` : '—')),
        render: (_p, i) => {
          const o = best[i]
          return o ? (
            <span>
              {o.merchant.name} <Muted>{formatPrice(o.total)}</Muted>{' '}
              <a href={o.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--win-link)' }}>
                {o.merchant.used ? 'View' : 'Buy'}
              </a>
            </span>
          ) : (
            '—'
          )
        },
      },
    ]
  }, [parts])

  if (parts.length === 0) {
    return (
      <NotFoundWindow
        title="Compare Parts"
        heading="Nothing to compare"
        subtext={ids.length ? "Those products aren't in the catalog." : 'Tick the compare boxes on any product list, then hit Compare.'}
        action={<TextLink to="/products">Browse products</TextLink>}
      />
    )
  }

  const remove = (id: string) => {
    const next = ids.filter((x) => x !== id)
    setParams(next.length ? { ids: next.join(',') } : {}, { replace: true })
  }

  const firstMeta = getCategoryMeta(parts[0].category)
  const inBuild = (p: Part) => build.components.find((s) => s.category === p.category)?.part?.id === p.id
  const missing = ids.length - parts.length

  return (
    <PageWindow>
      <WindowHeader active>
        <span>Compare {parts.length} Product{parts.length === 1 ? '' : 's'}</span>
      </WindowHeader>
      <WindowContent>
        <Crumbs>
          <Link to="/products">Browse Parts</Link>
          {firstMeta && (
            <>
              <span className="sep">›</span>
              <Link to={productsPath(firstMeta.id)}>{firstMeta.plural}</Link>
            </>
          )}
          <span className="sep">›</span>
          <span>Compare</span>
        </Crumbs>
        {missing > 0 && (
          <p style={{ fontSize: 12, margin: '0 0 8px' }}>
            {missing} product{missing === 1 ? '' : 's'} in this link {missing === 1 ? "isn't" : "aren't"} in the catalog any more.
          </p>
        )}
        <Scroll>
          <T>
            <thead>
              <tr>
                <th>
                  <Muted>Highlighted rows differ</Muted>
                </th>
                {parts.map((p) => (
                  <th key={p.id} scope="col">
                    <ColHead>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'flex-start' }}>
                        <span>
                          <PartNameLink part={p} /> <EraTag part={p} />
                          {have.has(p.id) && (
                            <>
                              {' '}
                              <HaveTag />
                            </>
                          )}
                        </span>
                        <RemoveBtn onClick={() => remove(p.id)} aria-label={`Remove ${p.brand} ${p.name}`} title="Remove">
                          ✕
                        </RemoveBtn>
                      </div>
                      {inBuild(p) ? (
                        <Strong style={{ fontSize: 11 }}>✓ In your build</Strong>
                      ) : (
                        <Button size="sm" onClick={() => addToBuild(p.category, p)} style={{ fontWeight: 700, alignSelf: 'flex-start' }}>
                          Add to Build
                        </Button>
                      )}
                    </ColHead>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const differs = parts.length > 1 && new Set(r.values).size > 1
                return (
                  <tr key={r.key} className={differs ? 'diff' : undefined}>
                    <th scope="row">{r.label}</th>
                    {parts.map((p, i) => (
                      <td key={p.id}>{r.render ? r.render(p, i) : r.values[i]}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </T>
        </Scroll>
        {parts.length < 2 && (
          <p style={{ fontSize: 12, marginTop: 8 }}>
            Add another product to compare —{' '}
            {firstMeta ? <TextLink to={productsPath(firstMeta.id)}>browse {firstMeta.plural.toLowerCase()}</TextLink> : null}.
          </p>
        )}
        <p style={{ fontSize: 11, color: 'var(--win-muted)', margin: '8px 0 0' }}>Prices are simulated for this demo — Buy opens the retailer&apos;s search.</p>
      </WindowContent>
    </PageWindow>
  )
}
