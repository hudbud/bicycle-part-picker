import { useEffect, useState, type ReactNode } from 'react'
import styled from 'styled-components'
import { Button } from 'react95'
import type { PartStatus, PartTracking } from '@/types/build'
import { Modal } from '@/components/ui/Modal'
import { TrackingFields } from '@/components/tracking/TrackingFields'
import { FieldInput, FieldLabel, FieldSelect } from '@/components/tracking/fields'

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 8px 12px;
  margin-bottom: 8px;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 12px;
`

const Sub = styled.div`
  font-size: 12px;
  margin-bottom: 10px;
  line-height: 1.4;
`

export interface TrackingDialogValue {
  status: PartStatus | undefined
  quantity: number
  tracking: PartTracking | undefined
}

interface TrackingDialogProps {
  open: boolean
  onClose: () => void
  title: string
  /** Part name / context line under the title. */
  subtitle?: ReactNode
  statusOptions: { value: PartStatus | ''; label: string }[]
  initial: TrackingDialogValue
  /** Hide the quantity field (bike slots: quantity is edited in the builder). */
  hideQuantity?: boolean
  showInstalledAt?: boolean
  saveLabel?: string
  onSave: (v: TrackingDialogValue) => void
  /** Extra content above the buttons (e.g. a "Move to bin" link). */
  footer?: ReactNode
}

const isEmpty = (t: PartTracking) => Object.values(t).every((v) => v == null || v === '')

/** Status + quantity + the shared TrackingFields editor, in a Win95 dialog. Edits apply on Save. */
export function TrackingDialog({
  open,
  onClose,
  title,
  subtitle,
  statusOptions,
  initial,
  hideQuantity,
  showInstalledAt,
  saveLabel = 'Save',
  onSave,
  footer,
}: TrackingDialogProps) {
  const [status, setStatus] = useState<PartStatus | undefined>(initial.status)
  const [qty, setQty] = useState(String(initial.quantity))
  const [tracking, setTracking] = useState<PartTracking | undefined>(initial.tracking)

  useEffect(() => {
    if (!open) return
    setStatus(initial.status)
    setQty(String(initial.quantity))
    setTracking(initial.tracking)
    // Re-seed only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const n = Math.round(Number(qty))
    onSave({
      status,
      quantity: Number.isFinite(n) && n > 0 ? Math.min(n, 99) : 1,
      tracking: tracking && !isEmpty(tracking) ? tracking : undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={title} style={{ maxWidth: 480, width: '100%' }}>
      <form onSubmit={save}>
        {subtitle && <Sub>{subtitle}</Sub>}
        <Row style={hideQuantity ? { gridTemplateColumns: 'minmax(0, 1fr)' } : undefined}>
          <FieldLabel>
            Status
            <FieldSelect value={status ?? ''} onChange={(e) => setStatus((e.target.value || undefined) as PartStatus | undefined)}>
              {statusOptions.map((o) => (
                <option key={o.value || 'none'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FieldSelect>
          </FieldLabel>
          {!hideQuantity && (
            <FieldLabel>
              Qty
              <FieldInput type="number" min={1} max={99} step={1} value={qty} onChange={(e) => setQty(e.target.value)} />
            </FieldLabel>
          )}
        </Row>
        <TrackingFields value={tracking} onChange={setTracking} showInstalledAt={showInstalledAt} />
        {footer}
        <Actions>
          <Button type="submit" primary style={{ fontWeight: 700, minWidth: 80 }}>
            {saveLabel}
          </Button>
          <Button type="button" onClick={onClose} style={{ minWidth: 80 }}>
            Cancel
          </Button>
        </Actions>
      </form>
    </Modal>
  )
}
