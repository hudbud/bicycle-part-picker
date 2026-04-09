import { useState } from 'react'
import type { Part, PartCategory } from '@/types/parts'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { GroupBox } from 'react95'
import styled from 'styled-components'

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 4px;
`

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
      name, brand, category,
      price: price ? parseFloat(price) : undefined,
      specs: {}, tags: ['Custom'],
      url: url || undefined,
      isCustom: true,
    }
    onAdd(part)
  }

  if (!open) {
    return (
      <Button variant="secondary" fullWidth onClick={() => setOpen(true)} style={{ fontSize: 12, textAlign: 'left' }}>
        + Can't find your part? Add a custom one
      </Button>
    )
  }

  return (
    <GroupBox label="Add a custom part" style={{ margin: 8 }}>
      <form onSubmit={handleSubmit}>
        <Grid>
          <Input label="Part name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Custom Frame" required />
          <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. My Brand" required />
          <Input label="Price (optional)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
          <Input label="URL (optional)" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </Grid>
        <ButtonRow>
          <Button type="submit" size="sm">Add part</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        </ButtonRow>
      </form>
    </GroupBox>
  )
}
