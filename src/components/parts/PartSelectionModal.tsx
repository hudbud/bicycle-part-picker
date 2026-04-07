import { useState, useMemo } from 'react'
import type { Part, PartCategory } from '@/types/parts'
import { getPartsByCategory } from '@/data/partsDatabase'
import { Modal } from '@/components/ui/Modal'
import { Drawer } from '@/components/ui/Drawer'
import { PartSearch } from './PartSearch'
import { PartFilters, type PartFiltersState } from './PartFilters'
import { PartCard } from './PartCard'
import { CustomPartForm } from './CustomPartForm'
import { EmptyState } from '@/components/ui/EmptyState'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface PartSelectionModalProps {
  open: boolean
  onClose: () => void
  category: PartCategory
  categoryLabel: string
  selectedPartId?: string
  onSelect: (part: Part) => void
}

export function PartSelectionModal({
  open,
  onClose,
  category,
  categoryLabel,
  selectedPartId,
  onSelect,
}: PartSelectionModalProps) {
  const isMobile = useIsMobile()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<PartFiltersState>({ materials: [], brands: [] })

  const allParts = useMemo(() => getPartsByCategory(category), [category])

  const availableBrands = useMemo(
    () => [...new Set(allParts.map((p) => p.brand))].sort(),
    [allParts],
  )

  const filtered = useMemo(() => {
    let parts = allParts
    if (query) {
      const q = query.toLowerCase()
      parts = parts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    if (filters.materials.length > 0) {
      parts = parts.filter((p) => p.specs.material && filters.materials.includes(p.specs.material as never))
    }
    if (filters.brands.length > 0) {
      parts = parts.filter((p) => filters.brands.includes(p.brand))
    }
    return parts
  }, [allParts, query, filters])

  const handleSelect = (part: Part) => {
    onSelect(part)
    onClose()
  }

  const content = (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 border-b border-border-default">
        <PartSearch value={query} onChange={setQuery} />
        <PartFilters filters={filters} onChange={setFilters} availableBrands={availableBrands} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            heading="No parts found"
            subtext="Try a different search or add a custom part below."
          />
        ) : (
          filtered.map((part) => (
            <PartCard
              key={part.id}
              part={part}
              selected={part.id === selectedPartId}
              onSelect={handleSelect}
            />
          ))
        )}
        <CustomPartForm category={category} onAdd={handleSelect} />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onClose={onClose} title={`Select a ${categoryLabel}`} side="bottom">
        {content}
      </Drawer>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={`Select a ${categoryLabel}`} className="max-w-2xl w-full">
      <div style={{ minHeight: 400 }}>{content}</div>
    </Modal>
  )
}
