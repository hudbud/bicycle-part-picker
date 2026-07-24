import { useEffect, useRef, type ReactNode } from 'react'
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
  style?: React.CSSProperties
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, children, style }: ModalProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    const firstFocusable = windowRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    firstFocusable?.focus()

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !windowRef.current) return
      const focusable = windowRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
      previouslyFocused.current?.focus()
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
      <StyledWindow ref={windowRef} style={style}>
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
