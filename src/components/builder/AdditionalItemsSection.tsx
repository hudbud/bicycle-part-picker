import { useState } from 'react'
import type { AdditionalItem } from '@/types/build'
import { useBuildStore } from '@/store/buildStore'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/utils/format'
import { TableRow, TableDataCell, Table, TableBody } from 'react95'
import styled from 'styled-components'
import { COLS, COL_COUNT } from './ComponentRow'
import { hiddenCategories } from '@/data/buildTemplates'
import { slotLabel } from '@/components/build/buildRows'

/**
 * The bottom of the parts list: freeform extras (grips, cages, lights…) and the "+ Add a line"
 * row, which brings back hidden part rows or starts a new extra.
 * `layout="desktop"` renders rows meant to sit inside the builder's main table body
 * (so the price lines up with the Price column); `layout="mobile"` renders its own table.
 */
type Layout = 'desktop' | 'mobile'

const AddLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  font-size: 11px;

  button {
    font-size: 11px;
    height: 22px;
    padding: 0 8px;
    white-space: nowrap;
  }
`

const SmallInput = styled.input`
  font-family: inherit;
  font-size: 12px;
  padding: 2px 4px;
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  background: var(--win-window);
  color: var(--win-window-text);
`

interface Draft { name: string; price: string; url: string; notes: string }
const emptyDraft: Draft = { name: '', price: '', url: '', notes: '' }

function ItemForm({ draft, onChange, onSubmit, onCancel, submitLabel, placeholder }: {
  draft: Draft
  onChange: (d: Draft) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
  placeholder?: string
}) {
  return (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit()
        if (e.key === 'Escape') onCancel()
      }}
    >
      <SmallInput value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} placeholder={placeholder ?? 'Item name'} style={{ flex: '1 1 140px' }} autoFocus aria-label="Item name" />
      <SmallInput value={draft.price} onChange={(e) => onChange({ ...draft, price: e.target.value })} placeholder="Price" type="number" min="0" step="0.01" style={{ width: 80 }} aria-label="Price" />
      <SmallInput value={draft.url} onChange={(e) => onChange({ ...draft, url: e.target.value })} placeholder="Link (optional)" type="url" style={{ flex: '2 1 160px' }} aria-label="Link" />
      <SmallInput value={draft.notes} onChange={(e) => onChange({ ...draft, notes: e.target.value })} placeholder="Notes (optional)" style={{ flex: '2 1 110px' }} aria-label="Notes" />
      <Button size="sm" onClick={onSubmit}>{submitLabel}</Button>
      <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
    </div>
  )
}

const parsePrice = (s: string) => {
  const n = parseFloat(s)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function AdditionalItemRow({ item, layout }: { item: AdditionalItem; layout: Layout }) {
  const { updateAdditionalItem, removeAdditionalItem } = useBuildStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const cols = layout === 'desktop' ? COL_COUNT : 3

  const startEdit = () => {
    setDraft({ name: item.name, price: item.price?.toString() ?? '', url: item.url ?? '', notes: item.notes ?? '' })
    setEditing(true)
  }
  const save = () => {
    updateAdditionalItem(item.id, {
      name: draft.name.trim() || item.name,
      price: parsePrice(draft.price),
      notes: draft.notes.trim() || undefined,
      url: draft.url.trim() || undefined,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <TableRow>
        <td colSpan={cols} style={{ padding: '4px 8px' }}>
          <ItemForm draft={draft} onChange={setDraft} onSubmit={save} onCancel={() => setEditing(false)} submitLabel="Save" />
        </td>
      </TableRow>
    )
  }

  const nameCell = (
    <span>
      {item.url ? (
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--win-link)', fontWeight: 700 }}>{item.name}</a>
      ) : <strong>{item.name}</strong>}
      {item.notes && <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 8 }}>{item.notes}</span>}
    </span>
  )
  const remove = (
    <Button variant="ghost" square style={{ fontSize: 11 }} onClick={() => removeAdditionalItem(item.id)} aria-label={`Remove ${item.name}`} title="Remove">
      ✕
    </Button>
  )
  const edit = <button type="button" onClick={startEdit} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontSize: 11, color: 'var(--win-link)', textDecoration: 'underline', cursor: 'pointer', marginLeft: 8 }}>edit</button>

  if (layout === 'mobile') {
    return (
      <TableRow>
        <TableDataCell style={{ fontSize: 12 }}>{nameCell}{edit}</TableDataCell>
        <TableDataCell style={{ width: 80, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{formatPrice(item.price)}</TableDataCell>
        <TableDataCell style={{ width: 36, textAlign: 'right' }}>{remove}</TableDataCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableDataCell style={{ width: COLS.component, fontSize: 12 }}>Extra</TableDataCell>
      <TableDataCell style={{ fontSize: 13 }}>{nameCell}{edit}</TableDataCell>
      <TableDataCell />
      {/* Price sits in the Paid column. */}
      <TableDataCell style={{ textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{formatPrice(item.price)}</TableDataCell>
      <td colSpan={COL_COUNT - 5} />
      <TableDataCell style={{ textAlign: 'right' }}>{remove}</TableDataCell>
    </TableRow>
  )
}

function ExtrasRows({ layout }: { layout: Layout }) {
  const build = useBuildStore((s) => s.build)
  const addAdditionalItem = useBuildStore((s) => s.addAdditionalItem)
  const showRow = useBuildStore((s) => s.showRow)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const items = build.additionalItems ?? []
  const hidden = hiddenCategories(build)
  const cols = layout === 'desktop' ? COL_COUNT : 3

  const reset = () => { setAdding(false); setDraft(emptyDraft) }
  const add = () => {
    if (!draft.name.trim()) return
    addAdditionalItem({
      name: draft.name.trim(),
      price: parsePrice(draft.price),
      notes: draft.notes.trim() || undefined,
      url: draft.url.trim() || undefined,
    })
    reset()
  }

  return (
    <>
      {items.map((item) => <AdditionalItemRow key={item.id} item={item} layout={layout} />)}

      {adding && (
        <TableRow>
          <td colSpan={cols} style={{ padding: '4px 8px' }}>
            <ItemForm draft={draft} onChange={setDraft} onSubmit={add} onCancel={reset} submitLabel="Add" placeholder="e.g. Grips, bar tape, bottle cages, fenders, lights…" />
          </td>
        </TableRow>
      )}

      <TableRow style={{ background: 'var(--win-face)', color: 'var(--win-text)' }}>
        <td colSpan={cols} style={{ padding: '4px 8px' }}>
          <AddLine role="group" aria-label="Add a line">
            <span style={{ fontWeight: 700 }}>+ Add a line:</span>
            {hidden.map((c) => (
              <Button key={c} size="sm" variant="secondary" onClick={() => showRow(c)} title={`Show the ${slotLabel(c)} row again`}>
                {slotLabel(c)}
              </Button>
            ))}
            <Button size="sm" variant="secondary" onClick={() => setAdding(true)} disabled={adding} title="Anything that isn't one of the rows above, with its own name and price">
              Something else…
            </Button>
          </AddLine>
        </td>
      </TableRow>
    </>
  )
}

/** Rows for the builder's main table body (desktop). */
export function AdditionalItemsRows() {
  return <ExtrasRows layout="desktop" />
}

/** Standalone extras table (mobile). */
export function AdditionalItemsSection() {
  return (
    <Table style={{ width: '100%' }}>
      <TableBody>
        <ExtrasRows layout="mobile" />
      </TableBody>
    </Table>
  )
}
