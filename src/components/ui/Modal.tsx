import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Window, WindowHeader, WindowContent, Button } from 'react95'
import styled from 'styled-components'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.5);
`

const StyledWindow = styled(Window)`
  width: 100%;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
`

const StyledHeader = styled(WindowHeader)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 4px;
`

const ScrollBody = styled(WindowContent)`
  overflow-y: auto;
  flex: 1;
  padding: 16px;
`

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Modal({ open, onClose, title, children, style }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <Backdrop
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <StyledWindow style={style}>
        {title && (
          <StyledHeader active>
            <span>{title}</span>
            <Button onClick={onClose} style={{ marginLeft: 'auto' }}>
              <span>✕</span>
            </Button>
          </StyledHeader>
        )}
        <ScrollBody>
          {children}
        </ScrollBody>
      </StyledWindow>
    </Backdrop>,
    document.body,
  )
}
