import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Button } from 'react95'
import type { PartCategory } from '@/types/parts'
import type { BinItem } from '@/store/partsBinStore'
import { useGarageStore } from '@/store/garageStore'
import { useBuildStore } from '@/store/buildStore'
import { installFromBin } from '@/store/partMoves'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { FieldLabel, FieldSelect } from '@/components/tracking/fields'
import { categoryName, slotHiddenOn, slotsFor, trackedBikes } from './inventory'

const Note = styled.p`
  font-size: 12px;
  line-height: 1.4;
  margin: 8px 0 0;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 14px;
`

interface InstallDialogProps {
  item: BinItem | undefined
  onClose: () => void
}

/** Pick a bike (and slot) and move a bin item onto it. Whatever was in the slot goes back to the bin. */
export function InstallDialog({ item, onClose }: InstallDialogProps) {
  const garage = useGarageStore((s) => s.builds)
  const current = useBuildStore((s) => s.build)
  const { success } = useToast()
  const bikes = useMemo(() => trackedBikes(garage, current), [garage, current])
  const [bikeKey, setBikeKey] = useState('')
  const [slot, setSlot] = useState<PartCategory | ''>('')

  const keyOf = (i: number) => String(i)
  const chosen = bikeKey !== '' ? bikes[Number(bikeKey)] : undefined
  const slots = item && chosen ? slotsFor(item.part, chosen.bike) : []

  useEffect(() => {
    if (!item) return
    setBikeKey(bikes.length ? keyOf(0) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item])

  useEffect(() => {
    setSlot(slots[0] ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bikeKey, item])

  if (!item) return null
  const occupant = chosen && slot ? chosen.bike.components.find((s) => s.category === slot)?.part : undefined
  const hidden = chosen && slot ? slotHiddenOn(slot, chosen.bike) : false

  const install = () => {
    if (!chosen || !slot) return
    installFromBin(item.id, chosen.ref, slot)
    success(`Installed ${item.part.brand} ${item.part.name} on ${chosen.bike.name || 'your bike'}`)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Install on bike" style={{ maxWidth: 420, width: '100%' }}>
      <div style={{ fontSize: 12, marginBottom: 10 }}>
        <strong style={{ fontWeight: 700 }}>{item.part.brand}</strong> {item.part.name}
      </div>
      {bikes.length === 0 ? (
        <Note>No bikes yet — start one in the Builder.</Note>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <FieldLabel>
            Bike
            <FieldSelect value={bikeKey} onChange={(e) => setBikeKey(e.target.value)}>
              {bikes.map((b, i) => (
                <option key={keyOf(i)} value={keyOf(i)}>
                  {b.label}
                </option>
              ))}
            </FieldSelect>
          </FieldLabel>
          {slots.length > 1 && (
            <FieldLabel>
              Slot
              <FieldSelect value={slot} onChange={(e) => setSlot(e.target.value as PartCategory)}>
                {slots.map((c) => (
                  <option key={c} value={c}>
                    {categoryName(c)}
                  </option>
                ))}
              </FieldSelect>
            </FieldLabel>
          )}
          {slot && (
            <Note style={{ marginTop: 0 }}>
              Goes in the <strong style={{ fontWeight: 700 }}>{categoryName(slot)}</strong> slot
              {occupant ? (
                <>
                  , replacing <strong style={{ fontWeight: 700 }}>{occupant.brand} {occupant.name}</strong> — that part moves back to
                  the bin with its tracking.
                </>
              ) : (
                '.'
              )}
              {chosen?.bike.odometerKm != null && ' The bike’s odometer is recorded as the install point.'}
            </Note>
          )}
          {hidden && <Note style={{ marginTop: 0 }}>This bike shows a single Wheelset row — split its wheels in the Builder to see this slot.</Note>}
        </div>
      )}
      <Actions>
        <Button primary onClick={install} disabled={!chosen || !slot} style={{ fontWeight: 700, minWidth: 80 }}>
          Install
        </Button>
        <Button onClick={onClose} style={{ minWidth: 80 }}>
          Cancel
        </Button>
      </Actions>
    </Modal>
  )
}
