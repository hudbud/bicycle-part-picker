import type { Material } from '@/types/parts'

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
  { value: 'carbon', label: 'Carbon' },
  { value: 'aluminum', label: 'Aluminum' },
  { value: 'steel', label: 'Steel' },
  { value: 'titanium', label: 'Titanium' },
]

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
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex flex-wrap gap-1.5">
        {MATERIALS.map((m) => (
          <button
            key={m.value}
            onClick={() => toggleMaterial(m.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              filters.materials.includes(m.value)
                ? 'bg-accent text-white border-accent'
                : 'bg-transparent text-text-secondary border-border-default hover:border-border-strong'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {availableBrands.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableBrands.slice(0, 8).map((brand) => (
            <button
              key={brand}
              onClick={() => toggleBrand(brand)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filters.brands.includes(brand)
                  ? 'bg-accent text-white border-accent'
                  : 'bg-transparent text-text-secondary border-border-default hover:border-border-strong'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export type { PartFiltersState }
