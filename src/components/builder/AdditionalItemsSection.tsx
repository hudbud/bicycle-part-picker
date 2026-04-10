import { useState } from 'react'
import type { AdditionalItem } from '@/types/build'
import { useBuildStore } from '@/store/buildStore'
import { Button } from '@/components/ui/Button'
import { TableRow, TableDataCell, Table, TableBody } from 'react95'

function AdditionalItemRow({ item }: { item: AdditionalItem }) {
  const { updateAdditionalItem, removeAdditionalItem } = useBuildStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [price, setPrice] = useState(item.price?.toString() ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [url, setUrl] = useState(item.url ?? '')

  const handleSave = () => {
    updateAdditionalItem(item.id, {
      name: name.trim() || item.name,
      price: price ? parseFloat(price) : undefined,
      notes: notes.trim() || undefined,
      url: url.trim() || undefined,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <TableRow>
        <td colSpan={5} style={{ padding: '4px 8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
              style={{ flex: '1 1 140px', fontFamily: 'inherit', fontSize: 12, padding: '2px 4px' }}
              autoFocus
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              type="number"
              min="0"
              step="0.01"
              style={{ width: 80, fontFamily: 'inherit', fontSize: 12, padding: '2px 4px' }}
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Link (optional)"
              type="url"
              style={{ flex: '2 1 160px', fontFamily: 'inherit', fontSize: 12, padding: '2px 4px' }}
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              style={{ flex: '2 1 120px', fontFamily: 'inherit', fontSize: 12, padding: '2px 4px' }}
            />
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </td>
      </TableRow>
    )
  }

  return (
    <TableRow onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
      <TableDataCell style={{ fontSize: 12, paddingLeft: 16 }}>
        <span style={{ marginRight: 4, opacity: 0.4 }}>·</span>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit' }}
            onClick={(e) => e.stopPropagation()}
          >
            {item.name}
          </a>
        ) : item.name}
        {item.notes && <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 8 }}>{item.notes}</span>}
      </TableDataCell>
      <TableDataCell />
      <TableDataCell style={{ width: 90, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>
        {item.price ? `$${item.price.toLocaleString()}` : '—'}
      </TableDataCell>
      <TableDataCell style={{ width: 120 }} />
      <TableDataCell style={{ width: 80, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
        <Button
          variant="secondary"
          square
          style={{ fontSize: 11 }}
          onClick={() => removeAdditionalItem(item.id)}
          aria-label={`Remove ${item.name}`}
        >
          ✕
        </Button>
      </TableDataCell>
    </TableRow>
  )
}

export function AdditionalItemsSection() {
  const { build, addAdditionalItem } = useBuildStore()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const items = build.additionalItems ?? []

  const handleAdd = () => {
    if (!newName.trim()) return
    addAdditionalItem({
      name: newName.trim(),
      price: newPrice ? parseFloat(newPrice) : undefined,
      notes: newNotes.trim() || undefined,
      url: newUrl.trim() || undefined,
    })
    setNewName('')
    setNewPrice('')
    setNewNotes('')
    setNewUrl('')
    setAdding(false)
  }

  const resetAdd = () => { setAdding(false); setNewName(''); setNewPrice(''); setNewNotes(''); setNewUrl('') }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') resetAdd()
  }

  return (
    <Table style={{ width: '100%' }}>
      <TableBody>
        <TableRow style={{ background: '#d4d0c8' }}>
          <td colSpan={4} style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px' }}>
            Extras &amp; Accessories
          </td>
          <TableDataCell style={{ width: 80, textAlign: 'right', padding: '4px 8px' }}>
            <Button size="sm" variant="secondary" onClick={() => setAdding(true)} style={{ fontSize: 11 }}>
              + Add
            </Button>
          </TableDataCell>
        </TableRow>

        {items.map((item) => (
          <AdditionalItemRow key={item.id} item={item} />
        ))}

        {adding && (
          <TableRow>
            <td colSpan={5} style={{ padding: '4px 8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }} onKeyDown={handleKeyDown}>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Stickers, Lights, Hose, Grips…"
                  style={{ flex: '1 1 140px', fontFamily: 'inherit', fontSize: 12, padding: '2px 4px' }}
                  autoFocus
                />
                <input
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Price"
                  type="number"
                  min="0"
                  step="0.01"
                  style={{ width: 80, fontFamily: 'inherit', fontSize: 12, padding: '2px 4px' }}
                />
                <input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="Link (optional)"
                  type="url"
                  style={{ flex: '2 1 160px', fontFamily: 'inherit', fontSize: 12, padding: '2px 4px' }}
                />
                <input
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  style={{ flex: '2 1 100px', fontFamily: 'inherit', fontSize: 12, padding: '2px 4px' }}
                />
                <Button size="sm" onClick={handleAdd}>Add</Button>
                <Button variant="secondary" size="sm" onClick={resetAdd}>Cancel</Button>
              </div>
            </td>
          </TableRow>
        )}

        {items.length === 0 && !adding && (
          <TableRow>
            <td colSpan={5} style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.6, padding: '4px 8px 4px 16px' }}>
              Add stickers, lights, hoses, cages, or anything else…
            </td>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
