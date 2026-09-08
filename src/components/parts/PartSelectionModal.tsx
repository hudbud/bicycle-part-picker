import { useEffect, useMemo, useRef, useState } from 'react'
import type { Part, PartCategory } from '@/types/parts'
import { getPartsByCategory } from '@/data/partsDatabase'
import { useCustomPartsStore } from '@/store/customPartsStore'
import { Modal } from '@/components/ui/Modal'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useIsMobile } from '@/hooks/useMediaQuery'
import styled from 'styled-components'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Field = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Suggestions = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  margin: 2px 0 0;
  padding: 0;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
  background: #c0c0c0;
  border: 2px solid;
  border-color: #fff #808080 #808080 #fff;
  box-shadow: 2px 2px 0 #000;
`

const SuggestionItem = styled.li<{ $active?: boolean }>`
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.35;
  background: ${({ $active }) => ($active ? '#000080' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : 'inherit')};

  &:hover {
    background: #000080;
    color: #fff;
  }
`

const SuggestionMeta = styled.span`
  display: block;
  font-size: 11px;
  opacity: 0.85;
`

const Hint = styled.p`
  font-size: 11px;
  line-height: 1.4;
  opacity: 0.75;
  margin: 0;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 4px;
`

interface PartSelectionModalProps {
  open: boolean
  onClose: () => void
  category: PartCategory
  categoryLabel: string
  selectedPart?: Part
  onSelect: (part: Part) => void
}

export function PartSelectionModal({
  open,
  onClose,
  category,
  categoryLabel,
  selectedPart,
  onSelect,
}: PartSelectionModalProps) {
  const isMobile = useIsMobile()
  const addCustomPart = useCustomPartsStore((s) => s.addPart)
  const customParts = useCustomPartsStore((s) => s.parts)

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const blurTimeout = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    setName(selectedPart?.name ?? '')
    setBrand(selectedPart?.brand ?? '')
    setPrice(selectedPart?.price != null ? String(selectedPart.price) : '')
    setUrl(selectedPart?.url ?? '')
    setSelectedId(selectedPart?.id)
    setShowSuggestions(false)
    setActiveIndex(0)
  }, [open, selectedPart])

  useEffect(() => {
    return () => {
      if (blurTimeout.current) window.clearTimeout(blurTimeout.current)
    }
  }, [])

  const catalog = useMemo(
    () => [...getPartsByCategory(category), ...customParts.filter((p) => p.category === category)],
    [category, customParts],
  )

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase()
    if (q.length < 1) return []
    return catalog
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 8)
  }, [catalog, name])

  const applySuggestion = (part: Part) => {
    setName(part.name)
    setBrand(part.brand)
    setPrice(part.price != null ? String(part.price) : '')
    setUrl(part.url ?? '')
    setSelectedId(part.id)
    setShowSuggestions(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedBrand = brand.trim()
    if (!trimmedName || !trimmedBrand) return

    const parsedPrice = price ? parseFloat(price) : undefined
    const fromCatalog = selectedId ? catalog.find((p) => p.id === selectedId) : undefined

    // Reuse catalog part when the form still matches the selected suggestion.
    if (
      fromCatalog &&
      fromCatalog.name === trimmedName &&
      fromCatalog.brand === trimmedBrand &&
      (fromCatalog.price ?? undefined) === (parsedPrice !== undefined && parsedPrice >= 0 ? parsedPrice : undefined) &&
      (fromCatalog.url ?? '') === (url.trim() || '')
    ) {
      onSelect(fromCatalog)
      onClose()
      return
    }

    const part: Part = {
      id: `custom-${crypto.randomUUID()}`,
      name: trimmedName,
      brand: trimmedBrand,
      category,
      price: parsedPrice !== undefined && parsedPrice >= 0 ? parsedPrice : undefined,
      specs: {},
      tags: ['Custom'],
      url: url.trim() || undefined,
      isCustom: true,
    }
    addCustomPart(part)
    onSelect(part)
    onClose()
  }

  const content = (
    <Form onSubmit={handleSubmit}>
      <Hint>
        Add any part for this slot. Start typing a name to fill details from the catalog, or enter your own.
      </Hint>

      <Field>
        <Input
          label="Part name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSelectedId(undefined)
            setShowSuggestions(true)
            setActiveIndex(0)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            blurTimeout.current = window.setTimeout(() => setShowSuggestions(false), 150)
          }}
          onKeyDown={(e) => {
            if (!showSuggestions || suggestions.length === 0) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIndex((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && showSuggestions) {
              e.preventDefault()
              applySuggestion(suggestions[activeIndex])
            } else if (e.key === 'Escape') {
              setShowSuggestions(false)
            }
          }}
          placeholder={`e.g. ${categoryLabel}`}
          autoComplete="off"
          required
        />
        {showSuggestions && suggestions.length > 0 && (
          <Suggestions role="listbox" aria-label="Catalog suggestions">
            {suggestions.map((part, index) => (
              <SuggestionItem
                key={part.id}
                role="option"
                aria-selected={index === activeIndex}
                $active={index === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault()
                  applySuggestion(part)
                }}
              >
                <strong>{part.name}</strong>
                <SuggestionMeta>
                  {part.brand}
                  {part.price != null ? ` · $${part.price.toLocaleString()}` : ''}
                </SuggestionMeta>
              </SuggestionItem>
            ))}
          </Suggestions>
        )}
      </Field>

      <Input
        label="Brand"
        value={brand}
        onChange={(e) => {
          setBrand(e.target.value)
          setSelectedId(undefined)
        }}
        placeholder="e.g. Specialized"
        required
      />

      <Input
        label="Price"
        type="number"
        value={price}
        onChange={(e) => {
          setPrice(e.target.value)
          setSelectedId(undefined)
        }}
        placeholder="0.00"
        min="0"
        step="0.01"
      />

      <Input
        label="URL"
        type="url"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value)
          setSelectedId(undefined)
        }}
        placeholder="https://..."
      />

      <ButtonRow>
        <Button type="submit" size="sm">Add to build</Button>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
      </ButtonRow>
    </Form>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onClose={onClose} title={`Add ${categoryLabel}`} side="bottom">
        {content}
      </Drawer>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add ${categoryLabel}`} style={{ maxWidth: 480, width: '100%' }}>
      {content}
    </Modal>
  )
}
