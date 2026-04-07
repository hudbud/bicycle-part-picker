import { useState } from 'react'
import type { Part, PartCategory } from '@/types/parts'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface CustomPartFormProps {
  category: PartCategory
  onAdd: (part: Part) => void
}

export function CustomPartForm({ category, onAdd }: CustomPartFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !brand) return
    const part: Part = {
      id: `custom-${crypto.randomUUID()}`,
      name,
      brand,
      category,
      price: price ? parseFloat(price) : undefined,
      specs: {},
      tags: ['Custom'],
      url: url || undefined,
      isCustom: true,
    }
    onAdd(part)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left px-4 py-3 text-sm text-accent hover:bg-bg-subtle transition-colors border-t border-border-default flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Can't find your part? Add a custom one
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border-default bg-bg-subtle space-y-3">
      <p className="text-sm font-medium text-text-primary">Add a custom part</p>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Part name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Custom Frame"
          required
        />
        <Input
          label="Brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="e.g. My Brand"
          required
        />
        <Input
          label="Price (optional)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
        />
        <Input
          label="URL (optional)"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Add part</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  )
}
