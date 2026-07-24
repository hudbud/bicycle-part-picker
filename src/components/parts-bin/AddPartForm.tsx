import { useState } from 'react'
import type { PartCategory } from '@/types/parts'
import type { PartStatus } from '@/types/build'
import type { Part } from '@/types/parts'
import { usePartsBinStore } from '@/store/partsBinStore'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import styled from 'styled-components'

const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`

const CATEGORIES: { value: PartCategory; label: string }[] = [
  { value: 'frame', label: 'Frame' },
  { value: 'fork', label: 'Fork' },
  { value: 'wheels', label: 'Wheels' },
  { value: 'tires', label: 'Tires' },
  { value: 'crankset', label: 'Crankset' },
  { value: 'bottomBracket', label: 'Bottom Bracket' },
  { value: 'chain', label: 'Chain' },
  { value: 'cassette', label: 'Cassette' },
  { value: 'handlebars', label: 'Handlebars' },
  { value: 'stem', label: 'Stem' },
  { value: 'saddle', label: 'Saddle' },
  { value: 'seatpost', label: 'Seatpost' },
  { value: 'pedals', label: 'Pedals' },
  { value: 'brakes', label: 'Brakes' },
]

const STATUSES: { value: PartStatus; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'partsbin', label: 'In Parts Bin' },
  { value: 'wanted', label: 'Wanted' },
]

interface AddPartFormProps {
  open: boolean
  onClose: () => void
}

export function AddPartForm({ open, onClose }: AddPartFormProps) {
  const { addItem } = usePartsBinStore()
  const { success } = useToast()
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState<PartCategory>('frame')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState<PartStatus>('owned')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedPrice = price ? parseFloat(price) : undefined
    const part: Part = {
      id: `custom-${crypto.randomUUID()}`,
      name,
      brand,
      category,
      price: parsedPrice !== undefined && parsedPrice >= 0 ? parsedPrice : undefined,
      specs: {},
      tags: [],
      isCustom: true,
    }
    addItem(part, status, notes || undefined)
    success('Part added to bin')
    setName(''); setBrand(''); setPrice(''); setNotes('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Part to Bin" style={{ maxWidth: 440, width: '100%' }}>
      <form onSubmit={handleSubmit}>
        <FormBody>
          <Input label="Part name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
          <Grid>
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as PartCategory)}
              options={CATEGORIES}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as PartStatus)}
              options={STATUSES}
            />
          </Grid>
          <Input
            label="Price (optional)"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
          <Textarea
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this part…"
            rows={2}
          />
          <Button type="submit" fullWidth>Add to Parts Bin</Button>
        </FormBody>
      </form>
    </Modal>
  )
}
