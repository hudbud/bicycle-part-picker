import { useState } from 'react'
import type { BinItem } from '@/store/partsBinStore'
import type { PartStatus } from '@/types/build'
import { usePartsBinStore } from '@/store/partsBinStore'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'

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
  const [status, setStatus] = useState<PartStatus>(item.status)

  const handleSave = () => {
    updateItem(item.id, {
      part: { ...item.part, name, brand, price: price ? parseFloat(price) : undefined },
      status,
      notes: notes || undefined,
    })
    setEditing(false)
    success('Part updated')
  }

  if (editing) {
    return (
      <tr className="bg-bg-subtle/50">
        <td className="px-4 py-2" colSpan={5}>
          <div className="flex flex-wrap gap-3 items-end">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-40" />
            <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-32" />
            <Input label="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-24" />
            <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-48" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-border-default hover:bg-bg-subtle/40 transition-colors">
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-text-primary">{item.part.name}</span>
        <span className="text-xs text-text-muted ml-2">{item.part.brand}</span>
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary capitalize">{item.part.category}</td>
      <td className="px-4 py-3 text-sm font-medium text-text-primary">
        {item.part.price ? `$${item.part.price.toLocaleString()}` : <span className="text-text-muted">—</span>}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3 text-sm text-text-muted max-w-xs truncate">
        {item.notes && <span title={item.notes}>{item.notes}</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-400"
            onClick={() => {
              removeItem(item.id)
              success('Part removed')
            }}
          >
            Remove
          </Button>
        </div>
      </td>
    </tr>
  )
}
