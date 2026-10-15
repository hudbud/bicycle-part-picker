import { useEffect, useState } from 'react'
import { Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell, Checkbox, Frame, Button } from 'react95'
import styled from 'styled-components'
import type { Build, ServiceKind } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import { updateBike, type BikeRef } from '@/store/bikeSync'
import { useSettingsStore } from '@/store/settingsStore'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import { withServiceEntry, withoutServiceEntry } from '@/utils/bikeOps'
import { formatDistance, fromKm, toKm } from '@/utils/distance'
import { formatPrice } from '@/utils/format'
import { slotLabel } from '@/components/build/buildRows'
import { FieldInput, FieldLabel, FieldSelect, FieldTextarea, parseNum, todayISO } from '@/components/tracking/fields'
import { SERVICE_KIND_LABELS, SERVICE_KINDS } from '@/components/tracking/serviceKinds'

const Form = styled.div`
  display: grid;
  grid-template-columns: 130px 120px minmax(0, 1fr) 110px 90px;
  gap: 6px 8px;
  align-items: end;

  .full { grid-column: 1 / -1; }

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    .title { grid-column: 1 / -1; }
  }
`

const PartsPick = styled(Frame).attrs({ variant: 'field' })`
  width: 100%;
  max-height: 132px;
  overflow-y: auto;
  padding: 2px 6px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0 8px;
  background: var(--win-window);
  color: var(--win-window-text);

  label { font-size: 12px; }
  & > * { min-width: 0; }
`

/** react95 cells use a 34px line-height; tighten so multi-line cells (notes) read as one row. */
const TightTable = styled(Table)`
  td { line-height: 1.3; padding-top: 5px; padding-bottom: 5px; }
`

const EntryCard = styled(Frame).attrs({ variant: 'field' })`
  width: 100%;
  padding: 6px 8px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

interface Draft {
  date: string
  kind: ServiceKind
  title: string
  categories: PartCategory[]
  odometer: string
  cost: string
  notes: string
}

const freshDraft = (build: Build, unit: 'mi' | 'km'): Draft => ({
  date: todayISO(),
  kind: 'serviced',
  title: '',
  categories: [],
  odometer: build.odometerKm != null ? String(Math.round(fromKm(build.odometerKm, unit))) : '',
  cost: '',
  notes: '',
})

const TITLE_HINTS: Partial<Record<ServiceKind, string>> = {
  replaced: 'New chain, fresh tires…',
  serviced: 'Fork lowers service, brake bleed…',
  adjusted: 'Indexed gears, trued rear wheel…',
  cleaned: 'Drivetrain degrease…',
  inspected: 'Pre-ride check…',
  repaired: 'Fixed flat, replaced cable…',
}

/** Per-bike maintenance log: add-entry form (date, kind, title, parts touched, odometer, cost, notes) + newest-first list. */
export function ServiceLog({ build, bike }: { build: Build; bike: BikeRef }) {
  const unit = useSettingsStore((s) => s.distanceUnit)
  const isMobile = useIsMobile()
  const { success, error } = useToast()
  const [draft, setDraft] = useState<Draft>(() => freshDraft(build, unit))
  const log = build.serviceLog ?? []
  const filled = build.components.filter((s) => s.part)
  // The odometer field is in display units — re-seed it if the unit flips.
  useEffect(() => {
    setDraft((d) => ({ ...d, odometer: build.odometerKm != null ? String(Math.round(fromKm(build.odometerKm, unit))) : '' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit])
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const toggleCategory = (c: PartCategory) =>
    set('categories', draft.categories.includes(c) ? draft.categories.filter((x) => x !== c) : [...draft.categories, c])

  const add = () => {
    const title = draft.title.trim() || (draft.categories.length ? `${SERVICE_KIND_LABELS[draft.kind]} ${draft.categories.map(slotLabel).join(', ').toLowerCase()}` : '')
    if (!title) { error('Give the entry a title (or pick the parts it touched)'); return }
    if (!draft.date) { error('Pick a date'); return }
    const odo = parseNum(draft.odometer)
    const cost = parseNum(draft.cost)
    updateBike(bike, (b) => withServiceEntry(b, {
      date: draft.date,
      kind: draft.kind,
      title,
      ...(draft.categories.length ? { categories: draft.categories } : {}),
      ...(odo != null ? { odometerKm: toKm(Math.max(0, odo), unit) } : {}),
      ...(cost != null ? { cost: Math.max(0, cost) } : {}),
      ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
    }))
    success('Service logged')
    setDraft({ ...freshDraft(build, unit), odometer: draft.odometer, date: draft.date })
  }

  const remove = (id: string) => updateBike(bike, (b) => withoutServiceEntry(b, id))

  const partsList = (cats?: PartCategory[]) => (cats?.length ? cats.map(slotLabel).join(', ') : 'Whole bike')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Form
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type !== 'checkbox') add()
        }}
      >
        <FieldLabel>
          Date
          <FieldInput type="date" value={draft.date} onChange={(e) => set('date', e.target.value)} />
        </FieldLabel>
        <FieldLabel>
          Kind
          <FieldSelect value={draft.kind} onChange={(e) => set('kind', e.target.value as ServiceKind)}>
            {SERVICE_KINDS.map((k) => <option key={k} value={k}>{SERVICE_KIND_LABELS[k]}</option>)}
          </FieldSelect>
        </FieldLabel>
        <FieldLabel className="title">
          Title
          <FieldInput value={draft.title} maxLength={120} placeholder={TITLE_HINTS[draft.kind] ?? 'What was done'} onChange={(e) => set('title', e.target.value)} />
        </FieldLabel>
        <FieldLabel>
          Odometer ({unit})
          <FieldInput type="number" min={0} step={1} inputMode="numeric" value={draft.odometer} onChange={(e) => set('odometer', e.target.value)} />
        </FieldLabel>
        <FieldLabel>
          Cost ($)
          <FieldInput type="number" min={0} step="0.01" inputMode="decimal" placeholder="0.00" value={draft.cost} onChange={(e) => set('cost', e.target.value)} />
        </FieldLabel>

        {filled.length > 0 && (
          <div className="full">
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
              Parts touched <span style={{ fontWeight: 400, color: 'var(--win-muted)' }}>(none = whole bike{draft.kind === 'replaced' ? '; “Replaced” resets distance on those parts' : ''})</span>
            </div>
            <PartsPick>
              {filled.map((s) => (
                <Checkbox
                  key={s.category}
                  label={slotLabel(s.category)}
                  checked={draft.categories.includes(s.category)}
                  onChange={() => toggleCategory(s.category)}
                />
              ))}
            </PartsPick>
          </div>
        )}

        <FieldLabel className="full">
          Notes
          <FieldTextarea rows={2} maxLength={1000} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Torque specs, shop, parts used…" />
        </FieldLabel>
        <div className="full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="sm" onClick={add} style={{ minWidth: 100 }}>+ Log entry</Button>
        </div>
      </Form>

      {log.length === 0 ? (
        <p style={{ fontSize: 12, margin: 0, color: 'var(--win-muted)' }}>No service logged yet.</p>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {log.map((e) => (
            <EntryCard key={e.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{e.date}</strong>
                <span>{e.cost != null ? formatPrice(e.cost) : ''}</span>
              </div>
              <div><strong>{SERVICE_KIND_LABELS[e.kind]}:</strong> {e.title}</div>
              <div style={{ fontSize: 11, color: 'var(--win-muted)' }}>
                {partsList(e.categories)}{e.odometerKm != null && ` · @ ${formatDistance(e.odometerKm, unit)}`}
              </div>
              {e.notes && <div style={{ fontSize: 11 }}>{e.notes}</div>}
              <div style={{ textAlign: 'right' }}>
                <Button size="sm" variant="flat" onClick={() => remove(e.id)} style={{ fontSize: 11 }} aria-label={`Delete ${e.title}`}>Delete</Button>
              </div>
            </EntryCard>
          ))}
        </div>
      ) : (
        <TightTable style={{ width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableHeadCell style={{ width: 90 }}>Date</TableHeadCell>
              <TableHeadCell style={{ width: 84 }}>Kind</TableHeadCell>
              <TableHeadCell>Work</TableHeadCell>
              <TableHeadCell style={{ width: 200 }}>Parts</TableHeadCell>
              <TableHeadCell style={{ width: 90, textAlign: 'right' }}>Odometer</TableHeadCell>
              <TableHeadCell style={{ width: 76, textAlign: 'right' }}>Cost</TableHeadCell>
              <TableHeadCell style={{ width: 36 }}></TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {log.map((e) => (
              <TableRow key={e.id}>
                <TableDataCell style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{e.date}</TableDataCell>
                <TableDataCell style={{ fontSize: 12 }}>{SERVICE_KIND_LABELS[e.kind]}</TableDataCell>
                <TableDataCell style={{ fontSize: 12 }}>
                  <strong>{e.title}</strong>
                  {e.notes && <div style={{ fontSize: 11, color: 'var(--win-muted)' }}>{e.notes}</div>}
                </TableDataCell>
                <TableDataCell style={{ fontSize: 11 }}>{partsList(e.categories)}</TableDataCell>
                <TableDataCell style={{ fontSize: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>{e.odometerKm != null ? formatDistance(e.odometerKm, unit) : '—'}</TableDataCell>
                <TableDataCell style={{ fontSize: 12, textAlign: 'right' }}>{e.cost != null ? formatPrice(e.cost) : '—'}</TableDataCell>
                <TableDataCell style={{ textAlign: 'right' }}>
                  <Button variant="flat" square size="sm" onClick={() => remove(e.id)} title="Delete entry" aria-label={`Delete ${e.title}`} style={{ fontSize: 11 }}>✕</Button>
                </TableDataCell>
              </TableRow>
            ))}
          </TableBody>
        </TightTable>
      )}
    </div>
  )
}
