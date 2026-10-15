import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Button, MenuList, MenuListItem, Separator } from 'react95'
import styled from 'styled-components'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAccountStore, type SyncStatus } from '@/account/accountStore'
import { deleteAccount, hasUnsavedChanges, signOut } from '@/account/cloudSync'
import { useToastStore } from '@/store/toastStore'

const Wrap = styled.div`
  position: relative;
  flex-shrink: 0;
`

const NameButton = styled(Button)`
  font-size: 12px;
  padding: 0 8px;
  white-space: nowrap;
  max-width: 160px;
  & > span { overflow: hidden; text-overflow: ellipsis; }
`

const Menu = styled(MenuList)`
  position: absolute;
  top: calc(100% + 2px);
  right: 0;
  z-index: 40;
  width: 240px;
`

const Info = styled.li`
  list-style: none;
  padding: 4px 8px 6px;
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
  .email { color: var(--win-muted); font-size: 11px; }
`

const Item = styled(MenuListItem)`
  font-size: 12px;
  height: 24px;
`

export const STATUS_TEXT: Record<SyncStatus, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved to your account ✓',
  offline: 'Offline: saving when you reconnect',
  error: "Couldn't save",
}

type Confirm = 'clear' | 'delete' | null

/** Sign out / clear / delete, with their confirmations. Render `dialogs` somewhere that stays mounted. */
export function useAccountActions() {
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [unsaved, setUnsaved] = useState(false)
  const toast = useToastStore((s) => s.show)

  const run = (fn: () => Promise<unknown>, done: string) => {
    setConfirm(null)
    fn().then(() => toast(done, 'info'), () => toast('That didn’t work. Check your connection and try again.', 'error'))
  }
  const ask = (c: Confirm) => { setUnsaved(hasUnsavedChanges()); setConfirm(c) }

  const dialogs = (
    <>
      <ConfirmDialog
        open={confirm === 'clear'}
        title="Sign Out & Clear"
        message={
          (unsaved ? 'Some changes haven’t reached your account yet and will be lost. ' : '') +
          'This signs you out and removes your bikes, parts and photos from this browser. They stay in your account for next time you sign in.'
        }
        confirmLabel="Sign out & clear"
        onConfirm={() => run(() => signOut({ clear: true }), 'Signed out and cleared this browser.')}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete Account"
        message="This permanently deletes your account and everything saved to it, photos included. This browser keeps its copy of your bikes and parts. Other devices keep theirs too, but stop syncing."
        confirmLabel="Delete account"
        onConfirm={() => run(deleteAccount, 'Account deleted. Your bikes and parts are still in this browser.')}
        onCancel={() => setConfirm(null)}
      />
    </>
  )

  return {
    signOut: () => run(() => signOut({ clear: false }), 'Signed out. Your bikes and parts are still in this browser.'),
    askClear: () => ask('clear'),
    askDelete: () => ask('delete'),
    dialogs,
  }
}

/** Sign in, or the signed-in person's menu. Shown only where accounts exist (not plain `vite`). */
export function AccountButton() {
  const { available, user, status, statusDetail, setSignInOpen } = useAccountStore()
  const [open, setOpen] = useState(false)
  const actions = useAccountActions()
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const onPointer = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus() } }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!available) return null
  if (!user) {
    return (
      <NameButton variant="flat" onClick={() => setSignInOpen(true)} style={{ flexShrink: 0 }}>
        Sign in
      </NameButton>
    )
  }

  const choose = (fn: () => void) => () => { setOpen(false); fn() }

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
  const onMenuKey = (e: ReactKeyboardEvent) => {
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      ;(document.activeElement as HTMLElement | null)?.click()
    } else if (e.key === 'Tab') setOpen(false)
  }

  const first = user.name.split(' ')[0] || user.name
  const dot = status === 'offline' || status === 'error' ? ' ⚠' : status === 'saving' ? ' …' : ''

  return (
    <Wrap ref={wrapRef}>
      <NameButton
        ref={buttonRef}
        variant={open ? 'raised' : 'flat'}
        active={open}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${user.name}. ${STATUS_TEXT[status]}`}
        title={statusDetail ?? STATUS_TEXT[status]}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{first}{dot} ▾</span>
      </NameButton>
      {open && (
        <Menu ref={menuRef} role="menu" aria-label="Account" onKeyDown={onMenuKey}>
          <Info role="presentation">
            <strong>{user.name}</strong>
            {user.email && <div className="email">{user.email}</div>}
            <div role="status" style={{ marginTop: 4, color: status === 'error' ? 'var(--win-bad)' : undefined }}>
              {statusDetail ?? STATUS_TEXT[status]}
            </div>
          </Info>
          <Separator />
          <Item role="menuitem" tabIndex={-1} onClick={choose(actions.signOut)}>
            Sign out
          </Item>
          <Item role="menuitem" tabIndex={-1} onClick={choose(actions.askClear)}>
            Sign out &amp; clear this browser…
          </Item>
          <Separator />
          <Item role="menuitem" tabIndex={-1} onClick={choose(actions.askDelete)}>
            Delete account…
          </Item>
        </Menu>
      )}

      {actions.dialogs}
    </Wrap>
  )
}
