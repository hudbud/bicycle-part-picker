import type { Material } from '@/types/parts'
import { Button } from 'react95'
import styled from 'styled-components'

interface PartFiltersState {
  materials: Material[]
  brands: string[]
  maxPrice?: number
}

interface PartFiltersProps {
  filters: PartFiltersState
  onChange: (f: PartFiltersState) => void
  availableBrands: string[]
}

const MATERIALS: { value: Material; label: string }[] = [
  { value: 'carbon',   label: 'Carbon' },
  { value: 'aluminum', label: 'Aluminum' },
  { value: 'steel',    label: 'Steel' },
  { value: 'titanium', label: 'Titanium' },
]

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`

export function PartFilters({ filters, onChange, availableBrands }: PartFiltersProps) {
  const toggleMaterial = (m: Material) => {
    const next = filters.materials.includes(m)
      ? filters.materials.filter((x) => x !== m)
      : [...filters.materials, m]
    onChange({ ...filters, materials: next })
  }

  const toggleBrand = (b: string) => {
    const next = filters.brands.includes(b)
      ? filters.brands.filter((x) => x !== b)
      : [...filters.brands, b]
    onChange({ ...filters, brands: next })
  }

  return (
    <div>
      <FilterRow>
        {MATERIALS.map((m) => (
          <Button
            key={m.value}
            variant={filters.materials.includes(m.value) ? 'raised' : 'flat'}
            onClick={() => toggleMaterial(m.value)}
            style={{ fontSize: 11 }}
          >
            {m.label}
          </Button>
        ))}
      </FilterRow>
      {availableBrands.length > 0 && (
        <FilterRow>
          {availableBrands.slice(0, 8).map((brand) => (
            <Button
              key={brand}
              variant={filters.brands.includes(brand) ? 'raised' : 'flat'}
              onClick={() => toggleBrand(brand)}
              style={{ fontSize: 11 }}
            >
              {brand}
            </Button>
          ))}
        </FilterRow>
      )}
    </div>
  )
}

export type { PartFiltersState }
