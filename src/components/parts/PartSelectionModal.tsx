import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Part, PartCategory } from '@/types/parts'
import { getPartsByCategory } from '@/data/partsDatabase'
import { useCustomPartsStore } from '@/store/customPartsStore'
import { Modal } from '@/components/ui/Modal'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { getPartPrice } from '@/data/pricing'
import { summarizeSpecs } from '@/data/specSchema'
import { formatPrice } from '@/utils/format'
import { ERA_OPTIONS, matchesEra, type EraFilter } from '@/components/products/productUtils'
import { Radio } from 'react95'
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
  background: var(--win-face);
  color: var(--win-text);
  border: 2px solid;
  border-color: var(--win-hilight) var(--win-shadow) var(--win-shadow) var(--win-hilight);
  box-shadow: 2px 2px 0 #000;
`

const SuggestionItem = styled.li<{ $active?: boolean }>`
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.35;
  background: ${({ $active }) => ($active ? 'var(--win-select)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--win-select-text)' : 'inherit')};

  &:hover {
    background: var(--win-select);
    color: var(--win-select-text);
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

const ERA_SHORT: Record<EraFilter, string> = { '': 'Any', current: 'Current', discontinued: 'Discontinued / vintage' }

const EraRow = styled.fieldset`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 10px;
  margin: 0;
  padding: 0;
  border: none;
  font-size: 12px;

  legend {
    float: left;
    padding: 0;
    margin-right: 6px;
    font-size: 12px;
  }
  label {
    margin: 0;
    font-size: 12px;
  }
`

const UsedTag = styled.span`
  display: inline-block;
  margin-left: 6px;
  padding: 0 3px;
  border: 1px solid currentColor;
  font-size: 10px;
  font-weight: 700;
  vertical-align: 1px;
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
  const [era, setEra] = useState<EraFilter>('')
  const blurTimeout = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    setName(selectedPart?.name ?? '')
    setBrand(selectedPart?.brand ?? '')
    const selectedPrice = getPartPrice(selectedPart)
    setPrice(selectedPrice != null ? String(selectedPrice) : '')
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

  const eraCounts = useMemo(() => {
    const discontinued = catalog.filter((p) => p.discontinued).length
    return { '': catalog.length, current: catalog.length - discontinued, discontinued }
  }, [catalog])
  // Era facet only when this slot's catalog has both current and discontinued/vintage parts.
  const showEra = eraCounts.current > 0 && eraCounts.discontinued > 0

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase()
    // With an era picked, list that era even before typing — handy for browsing vintage parts.
    if (q.length < 1 && !era) return []
    return catalog
      .filter((p) => matchesEra(p, era))
      .filter((p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 8)
  }, [catalog, name, era])

  const selectedCatalogPart = selectedId ? catalog.find((p) => p.id === selectedId) : undefined

  // Catalog parts are priced live (best in-stock retailer offer), custom parts by the user.
  const livePrice = (part: Part) => getPartPrice(part)

  const applySuggestion = (part: Part) => {
    const p = livePrice(part)
    setName(part.name)
    setBrand(part.brand)
    setPrice(p != null ? String(p) : '')
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
      livePrice(fromCatalog) === (parsedPrice !== undefined && parsedPrice >= 0 ? parsedPrice : undefined) &&
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
      {category === 'frame' && (
        <Hint>
          Frame missing from the catalog?{' '}
          <Link
            to={`/submit/frame?${new URLSearchParams({ ...(name.trim() && !selectedId ? { name: name.trim() } : {}), ...(brand.trim() && !selectedId ? { brand: brand.trim() } : {}) })}`}
            onClick={onClose}
            style={{ color: 'var(--win-link)' }}
          >
            Add it with full specs
          </Link>{' '}
          so compatibility checks work and others can use it.
        </Hint>
      )}

      {showEra && (
        <EraRow>
          <legend>Era:</legend>
          {ERA_OPTIONS.map((o) => (
            <Radio
              key={o.value || 'any'}
              name="part-era"
              value={o.value}
              checked={era === o.value}
              onChange={() => {
                setEra(o.value)
                setShowSuggestions(true)
                setActiveIndex(0)
              }}
              label={`${ERA_SHORT[o.value]} (${eraCounts[o.value]})`}
            />
          ))}
        </EraRow>
      )}

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
                {part.discontinued && era !== 'discontinued' && <UsedTag title="No longer made — price is a typical used-market value">Discontinued</UsedTag>}
                <SuggestionMeta>
                  {[part.brand, part.isCustom ? 'custom' : summarizeSpecs(part), livePrice(part) != null ? `${formatPrice(livePrice(part))}${part.discontinued ? ' used' : ''}` : null]
                    .filter(Boolean)
                    .join(' · ')}
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
        label={selectedCatalogPart?.discontinued ? 'Price (typical used-market value)' : 'Price'}
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
