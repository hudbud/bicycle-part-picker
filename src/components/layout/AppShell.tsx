import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { MenuList, MenuListItem } from 'react95'
import styled from 'styled-components'
import { TopBar } from './TopBar'
import { ToastContainer } from '@/components/ui/Toast'
import { DisplayPropertiesDialog, useDisplayProperties } from '@/components/display/DisplayProperties'
import { SignInDialog } from '@/components/account/SignInDialog'

const Desktop = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--win-desktop);
`

const Main = styled.main`
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
`

/** Right-click on the bare desktop → Properties, like Windows. */
function DesktopMenu({ at, onClose }: { at: { x: number; y: number }; onClose: () => void }) {
  const setOpen = useDisplayProperties((s) => s.setOpen)
  useEffect(() => {
    const close = () => onClose()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('pointerdown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return (
    <div style={{ position: 'fixed', left: at.x, top: at.y, zIndex: 60 }} onPointerDown={(e) => e.stopPropagation()}>
    <MenuList role="menu">
      <MenuListItem
        role="menuitem"
        size="sm"
        tabIndex={0}
        ref={(el) => el?.focus()}
        onClick={() => { onClose(); setOpen(true) }}
        onKeyDown={(e: ReactKeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); setOpen(true) } }}
      >
        Properties
      </MenuListItem>
    </MenuList>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuAt, setMenuAt] = useState<{ x: number; y: number }>()
  const onContextMenu = (e: MouseEvent) => {
    if (e.target !== e.currentTarget) return // only the desktop itself, not windows on it
    e.preventDefault()
    setMenuAt({ x: Math.min(e.clientX, window.innerWidth - 140), y: Math.min(e.clientY, window.innerHeight - 40) })
  }

  return (
    <Desktop onContextMenu={onContextMenu}>
      <TopBar />
      <Main onContextMenu={onContextMenu}>{children}</Main>
      <ToastContainer />
      {menuAt && <DesktopMenu at={menuAt} onClose={() => setMenuAt(undefined)} />}
      <DisplayPropertiesDialog />
      <SignInDialog />
    </Desktop>
  )
}
