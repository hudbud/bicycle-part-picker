import { useEffect, type ReactNode } from 'react'
import { Window, WindowHeader, WindowContent, Button } from 'react95'
import styled from 'styled-components'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.5);
`

const LeftPanel = styled(Window)`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 280px;
  z-index: 51;
  display: flex;
  flex-direction: column;
`

const BottomPanel = styled(Window)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  z-index: 51;
  display: flex;
  flex-direction: column;
`

const StyledHeader = styled(WindowHeader)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 4px;
  flex-shrink: 0;
`

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  side?: 'left' | 'bottom'
}

export function Drawer({ open, onClose, title, children, side = 'left' }: DrawerProps) {
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

  const Panel = side === 'bottom' ? BottomPanel : LeftPanel

  return (
    <>
      <Backdrop onClick={onClose} aria-hidden="true" />
      <Panel role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <StyledHeader active>
            <span>{title}</span>
            <Button onClick={onClose}>
              <span>✕</span>
            </Button>
          </StyledHeader>
        )}
        <WindowContent style={{ overflow: 'auto', flex: 1 }}>
          {children}
        </WindowContent>
      </Panel>
    </>
  )
}
