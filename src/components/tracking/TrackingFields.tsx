import { useId } from 'react'
import styled from 'styled-components'
import type { PartCondition, PartTracking } from '@/types/build'
import { useSettingsStore } from '@/store/settingsStore'
import { fromKm, toKm } from '@/utils/distance'
import { CONDITIONS, SOURCE_SUGGESTIONS } from './conditions'
import { FieldInput, FieldLabel, FieldSelect, FieldTextarea, parseNum } from './fields'

const Grid = styled.div<{ $compact?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $compact }) => ($compact ? 'repeat(auto-fill, minmax(120px, 1fr))' : 'repeat(2, minmax(0, 1fr))')};
  gap: ${({ $compact }) => ($compact ? '6px 8px' : '8px 12px')};

  .full { grid-column: 1 / -1; }

  @media (max-width: 420px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

export interface TrackingFieldsProps {
  value: PartTracking | undefined
  /** Called with the whole updated object on every edit. Empty fields come back as `undefined`. */
  onChange: (t: PartTracking) => void
  /** Denser grid (inline table editors, add-part forms). */
  compact?: boolean
  /**
   * Show the "Installed at (odometer)" field — only meaningful for parts on a bike,
   * so it's off by default (parts-bin items don't have one).
   */
  showInstalledAt?: boolean
}

/**
 * Editor for a part's tracking: price paid, source, acquired date, condition, serial,
 * notes (and optionally the odometer when it was installed, in the user's mi/km unit).
 * Controlled: it holds no state of its own.
 */
export function TrackingFields({ value, onChange, compact, showInstalledAt }: TrackingFieldsProps) {
  const t = value ?? {}
  const id = useId()
  const unit = useSettingsStore((s) => s.distanceUnit)
  const set = <K extends keyof PartTracking>(k: K, v: PartTracking[K]) => onChange({ ...t, [k]: v === '' ? undefined : v })

  return (
    <Grid $compact={compact}>
      <FieldLabel>
        Price paid ($)
        <FieldInput
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          value={t.pricePaid ?? ''}
          onChange={(e) => {
            const n = parseNum(e.target.value)
            set('pricePaid', n == null ? undefined : Math.max(0, n))
          }}
        />
      </FieldLabel>

      <FieldLabel>
        Source
        <FieldInput
          list={`${id}-sources`}
          placeholder="LBS, eBay, r/bikeswap…"
          value={t.source ?? ''}
          maxLength={80}
          onChange={(e) => set('source', e.target.value)}
        />
        <datalist id={`${id}-sources`}>
          {SOURCE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
        </datalist>
      </FieldLabel>

      <FieldLabel>
        Acquired
        <FieldInput type="date" value={t.acquiredAt ?? ''} onChange={(e) => set('acquiredAt', e.target.value)} />
      </FieldLabel>

      <FieldLabel>
        Condition
        <FieldSelect
          value={t.condition ?? ''}
          onChange={(e) => set('condition', (e.target.value || undefined) as PartCondition | undefined)}
        >
          <option value="">—</option>
          {CONDITIONS.map((c) => <option key={c.value} value={c.value} title={c.title}>{c.label}</option>)}
        </FieldSelect>
      </FieldLabel>

      <FieldLabel>
        Serial #
        <FieldInput value={t.serial ?? ''} maxLength={80} onChange={(e) => set('serial', e.target.value)} placeholder="optional" />
      </FieldLabel>

      {showInstalledAt && (
        <FieldLabel title="Bike odometer when this part went on — used for distance on the part">
          Installed at ({unit})
          <FieldInput
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="odometer"
            value={t.installedAtKm != null ? Math.round(fromKm(t.installedAtKm, unit)) : ''}
            onChange={(e) => {
              const n = parseNum(e.target.value)
              set('installedAtKm', n == null ? undefined : toKm(Math.max(0, Math.round(n)), unit))
            }}
          />
        </FieldLabel>
      )}

      <FieldLabel className="full">
        Notes
        <FieldTextarea
          rows={compact ? 2 : 3}
          maxLength={1000}
          value={t.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Scratches, spare bolts included, needs bearings…"
        />
      </FieldLabel>
    </Grid>
  )
}
