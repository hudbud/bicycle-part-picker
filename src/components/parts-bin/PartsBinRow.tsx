import { useState } from 'react'
import type { BinItem } from '@/store/partsBinStore'
import { usePartsBinStore } from '@/store/partsBinStore'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { TableRow, TableDataCell } from 'react95'

interface PartsBinRowProps {
  item: BinItem
}

export function PartsBinRow({ item }: PartsBinRowProps) {
  const { updateItem, removeItem } = usePartsBinStore()
  const { success } = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.part.name)
  const [brand, setBrand] = useState(item.part.brand)
  const [price, setPrice] = useState(item.part.price?.toString() ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')

  const handleSave = () => {
    updateItem(item.id, { part: { ...item.part, name, brand, price: price ? parseFloat(price) : undefined }, status: item.status, notes: notes || undefined })
    setEditing(false)
    success('Part updated')
  }

  if (editing) {
    return (
      <TableRow>
        <TableDataCell {...({ colSpan: 6 } as any)}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', padding: '4px 0' }}>
            <div style={{ width: 140 }}><Input label="Name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div style={{ width: 120 }}><Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
            <div style={{ width: 90 }}><Input label="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div style={{ width: 180 }}><Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        </TableDataCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableDataCell>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{item.part.name}</span>
        <span style={{ fontSize: 11, marginLeft: 6 }}>{item.part.brand}</span>
      </TableDataCell>
      <TableDataCell style={{ width: 120, fontSize: 12, textTransform: 'capitalize' }}>{item.part.category}</TableDataCell>
      <TableDataCell style={{ width: 90, fontSize: 13, fontWeight: 700 }}>
        {item.part.price ? `$${item.part.price.toLocaleString()}` : '—'}
      </TableDataCell>
      <TableDataCell style={{ width: 120 }}>
        <StatusBadge status={item.status} />
      </TableDataCell>
      <TableDataCell style={{ fontSize: 12, maxWidth: 200 }}>
        {item.notes && <span title={item.notes}>{item.notes}</span>}
      </TableDataCell>
      <TableDataCell style={{ width: 110 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => { removeItem(item.id); success('Part removed') }}>Remove</Button>
        </div>
      </TableDataCell>
    </TableRow>
  )
}
