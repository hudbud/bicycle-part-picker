import { Modal } from './Modal'
import { Button } from './Button'
import styled from 'styled-components'

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const BtnRow = styled.div`
  display: flex;
  gap: 8px;
`

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Continue', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} style={{ maxWidth: 340, width: '100%' }}>
      <Body>
        <p style={{ fontSize: 13 }}>{message}</p>
        <BtnRow>
          <Button size="sm" onClick={onConfirm} fullWidth>{confirmLabel}</Button>
          <Button variant="secondary" size="sm" onClick={onCancel} fullWidth>Cancel</Button>
        </BtnRow>
      </Body>
    </Modal>
  )
}
