import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { GroupBox, Checkbox, Radio, TextInput, Button } from 'react95'
import type { Part, PartCategory } from '@/types/parts'
import { getSpecFields, formatFacetValue, type SpecField } from '@/data/specSchema'
import { getPartPrice } from '@/data/pricing'
import {
  type BrowseFilters,
  type RangeValue,
  EMPTY_RANGE,
  facetOptions,
  numericExtent,
  numericValue,
  parseFacet,
  activeFilterCount,
  ERA_OPTIONS,
  matchesEra,
} from './productUtils'

const Side = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;

  fieldset {
    padding: 12px 8px 8px;
  }
  fieldset legend {
    font-size: 12px;
    font-weight: 700;
  }
`

const CheckList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 210px;
  overflow-y: auto;

  label {
    margin: 0;
    min-height: 22px;
    font-size: 12px;
  }
`

const RangeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  & > div {
    flex: 1;
    min-width: 0;
  }
  input {
    font-size: 12px;
    padding: 0 4px;
  }
`

const MoreButton = styled.button`
  background: none;
  border: none;
  color: var(--win-link);
  text-decoration: underline;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 0 0;
  text-align: left;
`

function RangeInputs({
  value,
  onChange,
  extent,
  prefix,
  unit,
  label,
}: {
  value: RangeValue
  onChange: (v: RangeValue) => void
  extent?: [number, number]
  prefix?: string
  unit?: string
  label: string
}) {
  const fmt = (n: number) => `${prefix ?? ''}${Math.round(n).toLocaleString()}${unit ? ` ${unit}` : ''}`
  return (
    <>
      <RangeRow>
        <TextInput
          type="number"
          value={value.min}
          placeholder="Min"
          aria-label={`${label} minimum`}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, min: e.target.value })}
        />
        <span>–</span>
        <TextInput
          type="number"
          value={value.max}
          placeholder="Max"
          aria-label={`${label} maximum`}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, max: e.target.value })}
        />
      </RangeRow>
      {extent && (
        <div style={{ marginTop: 4, color: 'var(--win-muted)', fontSize: 11 }}>
          {fmt(extent[0])} – {fmt(extent[1])}
        </div>
      )}
    </>
  )
}

const COLLAPSED_COUNT = 8

function facetLabel(field: SpecField, v: string): string {
  if (field.filter === 'bool') return v === 'true' ? 'Yes' : 'No'
  return formatFacetValue(field, parseFacet(v))
}

function CheckFacet({
  options,
  selected,
  onToggle,
  format,
}: {
  options: { value: string; count: number }[]
  selected: string[]
  onToggle: (v: string) => void
  format: (v: string) => string
}) {
  const [expanded, setExpanded] = useState(false)
  // Keep selected values visible even when collapsed.
  const visible = expanded ? options : options.filter((o, i) => i < COLLAPSED_COUNT || selected.includes(o.value))
  return (
    <>
      <CheckList>
        {visible.map((o) => (
          <Checkbox
            key={o.value}
            checked={selected.includes(o.value)}
            onChange={() => onToggle(o.value)}
            label={`${format(o.value)} (${o.count})`}
          />
        ))}
      </CheckList>
      {options.length > COLLAPSED_COUNT && (
        <MoreButton type="button" onClick={() => setExpanded((x) => !x)}>
          {expanded ? 'Show less' : `Show all ${options.length}`}
        </MoreButton>
      )}
    </>
  )
}

export interface CompatFilterInfo {
  enabled: boolean
  hidden: number
  /** False when the build has nothing else to check against. */
  available: boolean
}

interface FilterSidebarProps {
  category: PartCategory
  parts: Part[]
  filters: BrowseFilters
  onChange: (f: BrowseFilters) => void
  onReset: () => void
  compat: CompatFilterInfo
  onToggleCompat: (on: boolean) => void
}

const RATING_OPTIONS = [0, 4.5, 4, 3.5, 3]

export function FilterSidebar({ category, parts, filters, onChange, onReset, compat, onToggleCompat }: FilterSidebarProps) {
  const fields = useMemo(() => getSpecFields(category).filter((f) => f.filter), [category])

  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>()
    parts.forEach((p) => counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1))
    return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value))
  }, [parts])

  const priceExtent = useMemo(() => numericExtent(parts, getPartPrice), [parts])

  const facetGroups = useMemo(
    () =>
      fields
        .map((field) => ({
          field,
          options: field.filter === 'range' ? [] : facetOptions(parts, field),
          extent: field.filter === 'range' ? numericExtent(parts, (p) => numericValue(p, field)) : undefined,
        }))
        // Hide filters no part in the catalog has data for (old-format catalog entries lack attrs).
        .filter((g) => (g.field.filter === 'range' ? g.extent != null : g.options.length > 0)),
    [fields, parts],
  )

  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const setEnum = (field: SpecField, v: string) =>
    onChange({ ...filters, enums: { ...filters.enums, [field.key]: toggleIn(filters.enums[field.key] ?? [], v) } })

  const setRange = (field: SpecField, r: RangeValue) => onChange({ ...filters, ranges: { ...filters.ranges, [field.key]: r } })

  const eraCounts = useMemo(() => {
    const discontinued = parts.filter((p) => matchesEra(p, 'discontinued')).length
    return { '': parts.length, current: parts.length - discontinued, discontinued }
  }, [parts])
  // Only worth a facet when the category actually has both kinds (or one is selected).
  const showEra = !!filters.era || (eraCounts.current > 0 && eraCounts.discontinued > 0)

  const active = activeFilterCount(filters)

  const priceBox = (
    <GroupBox label="Price">
      <RangeInputs
        label="Price"
        value={filters.price}
        onChange={(price) => onChange({ ...filters, price })}
        extent={priceExtent}
        prefix="$"
      />
      {eraCounts.discontinued > 0 && filters.era !== 'current' && (
        <div style={{ marginTop: 4, color: 'var(--win-muted)', fontSize: 11 }}>Discontinued parts: typical used price</div>
      )}
    </GroupBox>
  )

  return (
    <Side>
      <GroupBox label="Compatibility Filter">
        <Checkbox
          checked={compat.enabled}
          onChange={(e) => onToggleCompat(e.target.checked)}
          label="Compatible with my build"
          disabled={!compat.available}
        />
        <div style={{ color: 'var(--win-muted)', fontSize: 11, marginTop: 4 }}>
          {!compat.available
            ? 'Add parts to your build to filter by compatibility.'
            : compat.enabled
              ? compat.hidden > 0
                ? `${compat.hidden} incompatible hidden`
                : 'No incompatible parts hidden'
              : 'Showing all parts'}
        </div>
      </GroupBox>

      <Button onClick={onReset} disabled={active === 0} fullWidth>
        Reset filters{active ? ` (${active})` : ''}
      </Button>

      {showEra && (
        <GroupBox label="Era">
          <CheckList>
            {ERA_OPTIONS.map((o) => (
              <Radio
                key={o.value || 'any'}
                name="era"
                value={o.value}
                checked={filters.era === o.value}
                onChange={() => onChange({ ...filters, era: o.value })}
                label={`${o.label} (${eraCounts[o.value]})`}
              />
            ))}
          </CheckList>
        </GroupBox>
      )}

      {brandOptions.length > 0 && (
        <GroupBox label="Manufacturer">
          <CheckFacet
            options={brandOptions}
            selected={filters.brands}
            onToggle={(v) => onChange({ ...filters, brands: toggleIn(filters.brands, v) })}
            format={(v) => v}
          />
        </GroupBox>
      )}

      {facetGroups.map(({ field, options, extent }) => (
        <GroupBox key={field.key} label={field.label}>
          {field.filter === 'range' ? (
            <RangeInputs
              label={field.label}
              value={filters.ranges[field.key] ?? EMPTY_RANGE}
              onChange={(r) => setRange(field, r)}
              extent={extent}
              unit={field.unit}
            />
          ) : (
            <CheckFacet
              options={options}
              selected={filters.enums[field.key] ?? []}
              onToggle={(v) => setEnum(field, v)}
              format={(v) => facetLabel(field, v)}
            />
          )}
        </GroupBox>
      ))}

      {priceBox}

      <GroupBox label="Rating">
        <CheckList>
          {RATING_OPTIONS.map((r) => (
            <Radio
              key={r}
              name="minRating"
              value={r}
              checked={filters.minRating === r}
              onChange={() => onChange({ ...filters, minRating: r })}
              label={r === 0 ? 'Any rating' : `${r}★ & up`}
            />
          ))}
        </CheckList>
      </GroupBox>
    </Side>
  )
}
