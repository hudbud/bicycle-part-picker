import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
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

interface DeleteConfirmProps {
  onConfirm: () => void
}

export function DeleteConfirm({ onConfirm }: DeleteConfirmProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>Delete</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete build?" style={{ maxWidth: 300, width: '100%' }}>
        <Body>
          <p style={{ fontSize: 13 }}>This can't be undone.</p>
          <BtnRow>
            <Button variant="danger" size="sm" onClick={() => { onConfirm(); setOpen(false) }} fullWidth>Delete</Button>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)} fullWidth>Cancel</Button>
          </BtnRow>
        </Body>
      </Modal>
    </>
  )
}
