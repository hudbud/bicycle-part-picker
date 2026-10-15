import { useEffect, useState } from 'react'
import type { PartStatus, PartTracking } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import type { BikeRef } from '@/store/bikeSync'
import { uninstallToBin } from '@/store/partMoves'
import { useSettingsStore } from '@/store/settingsStore'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { getSlotRow, partTitle, slotLabel } from '@/components/build/buildRows'
import { kmOnPart, lastServiceFor } from '@/utils/bikeOps'
import { formatDistance } from '@/utils/distance'
import { formatPrice } from '@/utils/format'
import { Separator } from 'react95'
import { TrackingFields } from './TrackingFields'
import { FieldLabel, FieldSelect } from './fields'
import { STATUS_OPTIONS } from './conditions'
import { setSlotStatus, setSlotTracking, useBike } from './bikeEdits'
import { SERVICE_KIND_LABELS } from './serviceKinds'

interface PartTrackingDialogProps {
  bike: BikeRef
  /** Slot to edit; `null` = closed. */
  category: PartCategory | null
  onClose: () => void
}

const meta = { fontSize: 12, margin: 0, lineHeight: 1.5 } as const

/**
 * "Details" dialog for one part on a bike: status, what was paid, where from, condition,
 * serial, notes, install odometer, distance on the part — plus Move to Parts Bin.
 */
export function PartTrackingDialog({ bike, category, onClose }: PartTrackingDialogProps) {
  const build = useBike(bike)
  const unit = useSettingsStore((s) => s.distanceUnit)
  const { success } = useToast()
  const slot = category ? build?.components.find((s) => s.category === category) : undefined
  const [draft, setDraft] = useState<PartTracking>({})
  const [status, setStatus] = useState<PartStatus | ''>('')

  const partId = slot?.part?.id
  useEffect(() => {
    if (!category) return
    setDraft(slot?.tracking ?? {})
    setStatus(slot?.status ?? '')
    // Re-seed only when a different slot/part is opened, not on every store write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, partId])

  if (!category || !build || !slot?.part) return null

  const row = getSlotRow(slot)
  const label = slotLabel(category)
  const onPart = kmOnPart(build, { ...slot, tracking: draft })
  const last = lastServiceFor(build, category)

  const save = () => {
    setSlotTracking(bike, category, partId, draft)
    setSlotStatus(bike, category, partId, status || undefined)
  }

  const moveToBin = () => {
    save()
    uninstallToBin(bike, category)
    success(`${partTitle(slot.part!)} moved to the Parts Bin`)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={`${label} — Details`} style={{ maxWidth: 520, width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {row.quantity > 1 && `${row.quantity} × `}{partTitle(row.part!)}
            {row.isCustom && <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 6 }}>(custom)</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--win-muted)' }}>
            on <strong>{build.name}</strong>
            {row.part!.discontinued && ' · discontinued'}
          </div>
        </div>

        <FieldLabel style={{ maxWidth: 220 }}>
          Status
          <FieldSelect value={status} onChange={(e) => setStatus(e.target.value as PartStatus | '')}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </FieldSelect>
        </FieldLabel>

        <TrackingFields value={draft} onChange={setDraft} showInstalledAt />
        {row.quantity > 1 && <p style={{ ...meta, fontSize: 11, color: 'var(--win-muted)' }}>Price paid is the total for all {row.quantity}.</p>}

        <Separator />

        <div>
          <p style={meta}>
            On this part:{' '}
            <strong>{onPart != null ? formatDistance(onPart, unit) : '—'}</strong>
            {onPart == null && (
              <span style={{ fontSize: 11, color: 'var(--win-muted)' }}>
                {' '}({build.odometerKm == null ? 'set the bike’s odometer on its Garage page' : 'enter “Installed at” or log a replacement'})
              </span>
            )}
          </p>
          <p style={meta}>
            Last service:{' '}
            {last ? (
              <span>
                {last.date} — {SERVICE_KIND_LABELS[last.kind]}: {last.title}
                {last.odometerKm != null && ` @ ${formatDistance(last.odometerKm, unit)}`}
              </span>
            ) : <span style={{ color: 'var(--win-muted)' }}>none logged</span>}
          </p>
          {row.price != null && (
            <p style={{ ...meta, fontSize: 11, color: 'var(--win-muted)' }}>
              Market today: {formatPrice(row.price)}
              {row.offer && <> @ {row.offer.merchant.name}{row.offer.merchant.used ? ' (used)' : ''}</>}
              {' '}<span style={{ fontStyle: 'italic' }}>(simulated)</span>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={moveToBin} title="Take it off this bike and keep it (with what you paid) in your Parts Bin">
            Move to Parts Bin
          </Button>
          <span style={{ display: 'flex', gap: 6 }}>
            <Button size="sm" onClick={() => { save(); success('Saved'); onClose() }} style={{ minWidth: 72 }}>OK</Button>
            <Button variant="secondary" size="sm" onClick={onClose} style={{ minWidth: 72 }}>Cancel</Button>
          </span>
        </div>
      </div>
    </Modal>
  )
}
