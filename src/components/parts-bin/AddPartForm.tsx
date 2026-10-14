import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Button, Radio } from 'react95'
import type { Part, PartCategory } from '@/types/parts'
import type { PartStatus, PartTracking } from '@/types/build'
import { usePartsBinStore } from '@/store/partsBinStore'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { ALL_CATEGORIES, WHEEL_SUB_CATEGORIES, defaultQuantity } from '@/data/categoryConfig'
import { searchParts } from '@/data/partsDatabase'
import { getPartPrice } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { TrackingFields } from '@/components/tracking/TrackingFields'
import { FieldInput, FieldLabel, FieldSelect, parseNum } from '@/components/tracking/fields'
import { BIN_STATUSES, categoryName } from './inventory'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;
`

const Grid = styled.div<{ $cols?: string }>`
  display: grid;
  grid-template-columns: ${({ $cols }) => $cols ?? 'repeat(2, minmax(0, 1fr))'};
  gap: 8px 12px;
`

const Modes = styled.div`
  display: flex;
  gap: 14px;
  label { margin: 0; font-size: 12px; }
`

const SearchWrap = styled.div`
  position: relative;
`

const Results = styled.ul`
  list-style: none;
  margin: 2px 0 0;
  padding: 0;
  max-height: 210px;
  overflow-y: auto;
  background: var(--win-window);
  color: var(--win-window-text);
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
`

const Result = styled.li<{ $active?: boolean }>`
  padding: 4px 6px;
  cursor: pointer;
  line-height: 1.3;
  background: ${({ $active }) => ($active ? 'var(--win-select)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--win-select-text)' : 'inherit')};
  &:hover { background: var(--win-select); color: var(--win-select-text); }
  & + & { border-top: 1px solid var(--win-stripe); }
`

const Chosen = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: var(--win-window);
  color: var(--win-window-text);
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
`

const Section = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: var(--win-link);
  border-bottom: 1px solid var(--win-shadow);
  padding-bottom: 2px;
`

const CATEGORY_OPTIONS = [...ALL_CATEGORIES, ...WHEEL_SUB_CATEGORIES.filter((c) => ['hub', 'rim', 'spokes'].includes(c.id))]

interface AddPartFormProps {
  open: boolean
  onClose: () => void
}

/** Add a part to the bin: find it in the catalog (or enter a custom one), then what you paid etc. */
export function AddPartForm({ open, onClose }: AddPartFormProps) {
  const addItem = usePartsBinStore((s) => s.addItem)
  const { success } = useToast()
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [picked, setPicked] = useState<Part | undefined>()
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState<PartCategory>('frame')
  const [listPrice, setListPrice] = useState('')
  const [status, setStatus] = useState<PartStatus>('owned')
  const [qty, setQty] = useState('1')
  const [tracking, setTracking] = useState<PartTracking | undefined>()

  useEffect(() => {
    if (!open) return
    setMode('catalog'); setQuery(''); setPicked(undefined); setActive(0)
    setName(''); setBrand(''); setCategory('frame'); setListPrice('')
    setStatus('owned'); setQty('1'); setTracking(undefined)
  }, [open])

  const results = useMemo(() => (query.trim().length < 2 ? [] : searchParts(query.trim()).slice(0, 10)), [query])

  const pick = (p: Part) => {
    setPicked(p)
    setQuery('')
    setQty(String(defaultQuantity(p.category)))
  }

  const canSubmit = mode === 'catalog' ? !!picked : name.trim() !== '' && brand.trim() !== ''

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    let part: Part
    if (mode === 'catalog' && picked) part = picked
    else {
      const p = parseNum(listPrice)
      part = {
        id: `custom-${crypto.randomUUID()}`,
        name: name.trim(),
        brand: brand.trim(),
        category,
        price: p != null && p >= 0 ? p : undefined,
        specs: {},
        tags: [],
        isCustom: true,
      }
    }
    const n = Math.round(Number(qty))
    const t = tracking && Object.values(tracking).some((v) => v != null && v !== '') ? tracking : undefined
    addItem(part, status, undefined, { quantity: Number.isFinite(n) && n > 0 ? Math.min(n, 99) : 1, tracking: t })
    success(`${part.brand} ${part.name} added to the bin`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Part to Bin" style={{ maxWidth: 500, width: '100%' }}>
      <Form onSubmit={submit}>
        <Modes role="radiogroup" aria-label="Part source">
          <Radio name="add-mode" value="catalog" checked={mode === 'catalog'} onChange={() => setMode('catalog')} label="From the catalog" />
          <Radio name="add-mode" value="custom" checked={mode === 'custom'} onChange={() => setMode('custom')} label="Not in the catalog" />
        </Modes>

        {mode === 'catalog' ? (
          picked ? (
            <Chosen>
              <span>
                <strong style={{ fontWeight: 700 }}>{picked.brand}</strong> {picked.name}
                <span style={{ color: 'var(--win-muted)', marginLeft: 6 }}>
                  {categoryName(picked.category)}
                  {picked.discontinued ? ' · discontinued' : ''}
                </span>
              </span>
              <Button size="sm" type="button" onClick={() => setPicked(undefined)}>
                Change
              </Button>
            </Chosen>
          ) : (
            <SearchWrap>
              <FieldLabel>
                Search the catalog
                <FieldInput
                  autoFocus
                  value={query}
                  placeholder="e.g. Deore XT M8100, Brooks B17, Bridgestone MB-1…"
                  onChange={(e) => { setQuery(e.target.value); setActive(0) }}
                  onKeyDown={(e) => {
                    if (!results.length) return
                    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)) }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
                    else if (e.key === 'Enter') { e.preventDefault(); pick(results[active]) }
                  }}
                  aria-autocomplete="list"
                />
              </FieldLabel>
              {results.length > 0 && (
                <Results role="listbox" aria-label="Catalog matches">
                  {results.map((p, i) => (
                    <Result key={p.id} role="option" aria-selected={i === active} $active={i === active} onMouseDown={(e) => { e.preventDefault(); pick(p) }}>
                      <strong style={{ fontWeight: 700 }}>{p.brand}</strong> {p.name}
                      <div style={{ fontSize: 11, opacity: 0.8 }}>
                        {categoryName(p.category)}
                        {p.discontinued ? ' · discontinued' : ''}
                        {getPartPrice(p) != null ? ` · ${formatPrice(getPartPrice(p))}${p.discontinued ? ' used' : ''}` : ''}
                      </div>
                    </Result>
                  ))}
                </Results>
              )}
              {query.trim().length >= 2 && results.length === 0 && (
                <p style={{ margin: '4px 0 0', color: 'var(--win-muted)' }}>
                  No catalog match —{' '}
                  <button type="button" onClick={() => { setMode('custom'); setName(query.trim()) }} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--win-link)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
                    add it as a custom part
                  </button>
                </p>
              )}
            </SearchWrap>
          )
        ) : (
          <Grid>
            <FieldLabel>
              Part name
              <FieldInput value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
            </FieldLabel>
            <FieldLabel>
              Brand
              <FieldInput value={brand} onChange={(e) => setBrand(e.target.value)} required maxLength={60} />
            </FieldLabel>
            <FieldLabel>
              Category
              <FieldSelect value={category} onChange={(e) => setCategory(e.target.value as PartCategory)}>
                {CATEGORY_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </FieldSelect>
            </FieldLabel>
            <FieldLabel title="Today's value / list price, for wishlist totals">
              Value ($, optional)
              <FieldInput type="number" min={0} step="0.01" value={listPrice} onChange={(e) => setListPrice(e.target.value)} placeholder="0.00" />
            </FieldLabel>
          </Grid>
        )}

        <Section>Tracking</Section>
        <Grid $cols="minmax(0, 2fr) minmax(0, 1fr)">
          <FieldLabel>
            Status
            <FieldSelect value={status} onChange={(e) => setStatus(e.target.value as PartStatus)}>
              {BIN_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label} — {s.hint}</option>)}
            </FieldSelect>
          </FieldLabel>
          <FieldLabel>
            Qty
            <FieldInput type="number" min={1} max={99} step={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          </FieldLabel>
        </Grid>
        <TrackingFields value={tracking} onChange={setTracking} compact />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
          <Button type="submit" primary disabled={!canSubmit} style={{ fontWeight: 700 }}>
            Add to Parts Bin
          </Button>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
