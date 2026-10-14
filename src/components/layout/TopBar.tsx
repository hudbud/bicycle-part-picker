import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, Button, Separator, MenuList, MenuListItem, Frame } from 'react95'
import styled from 'styled-components'
import { MobileNav, TRACKER_LINKS, RESEARCH_LINKS, ABOUT_LINK, TRENDS_LINK, CATEGORIES_BY_GROUP, isProductsPath } from './MobileNav'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useBuildStore } from '@/store/buildStore'
import { useCompat } from '@/hooks/useCompat'
import { getTrackingTotals } from '@/data/pricing'
import { productsPath, type CategoryGroup } from '@/data/categoryConfig'
import { CompatIcon } from '@/components/ui/CompatIcon'
import { formatPrice } from '@/utils/format'
import { useDisplayProperties } from '@/components/display/DisplayProperties'
import { AccountButton } from '@/components/account/AccountButton'

/** Below this width the full link row doesn't fit; collapse into the drawer. */
const COLLAPSE_QUERY = '(max-width: 999px)'
const PHONE_QUERY = '(max-width: 639px)'

const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  font-weight: 700;
  font-size: 13px;
  color: inherit;
  text-decoration: none;
  margin-right: 4px;
  white-space: nowrap;
`

const NavButton = styled(Button)`
  font-size: 12px;
  padding: 0 8px;
  white-space: nowrap;
`

const TopLink = styled(NavLink)`
  text-decoration: none;
  color: inherit;
  outline: none;
  &:focus-visible > * { outline: 1px dotted var(--win-text); outline-offset: -4px; }
`

const NavRow = styled.nav`
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
`

// ---------- Products dropdown ----------

const MENU_COLUMNS: CategoryGroup[][] = [
  ['Frameset', 'Wheels & Tires'],
  ['Drivetrain'],
  ['Brakes', 'Cockpit', 'Contact Points'],
]

const DropdownWrap = styled.div`
  position: relative;
`

const Dropdown = styled(MenuList)`
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(3, minmax(150px, auto));
  column-gap: 4px;
`

const Column = styled.li`
  list-style: none;
  display: flex;
  flex-direction: column;
`

const GroupList = styled.ul`
  list-style: none;
  margin: 0 0 4px;
  padding: 0;
`

const GroupHeading = styled.li`
  list-style: none;
  font-size: 11px;
  font-weight: 700;
  color: var(--win-link);
  padding: 4px 8px 2px;
`

const MenuItem = styled(MenuListItem)`
  padding: 0;
  font-size: 12px;
  height: 22px;
  line-height: 22px;
  &:focus-within {
    color: ${({ theme }) => (theme as any).materialTextInvert};
    background: ${({ theme }) => (theme as any).hoverBackground};
  }
`

const MenuLink = styled(Link)`
  flex: 1;
  align-self: stretch;
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: inherit;
  text-decoration: none;
  outline: none;
  text-align: left;
`

const MenuFooter = styled.li`
  list-style: none;
  grid-column: 1 / -1;
`

function ProductsMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const focusOnOpen = useRef<'first' | 'last' | null>(null)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>('a[role="menuitem"]') ?? [])

  useEffect(() => {
    if (!open) return
    if (focusOnOpen.current) {
      const list = items()
      ;(focusOnOpen.current === 'first' ? list[0] : list[list.length - 1])?.focus()
      focusOnOpen.current = null
    }
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onButtonKey = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      focusOnOpen.current = e.key === 'ArrowDown' ? 'first' : 'last'
      if (open) {
        const list = items()
        ;(e.key === 'ArrowDown' ? list[0] : list[list.length - 1])?.focus()
        focusOnOpen.current = null
      } else setOpen(true)
    }
  }

  const onMenuKey = (e: ReactKeyboardEvent) => {
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLAnchorElement)
    let next: number | null = null
    if (e.key === 'ArrowDown') next = (i + 1) % list.length
    else if (e.key === 'ArrowUp') next = (i - 1 + list.length) % list.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = list.length - 1
    else if (e.key === 'Tab') { setOpen(false); return }
    if (next != null) {
      e.preventDefault()
      list[next]?.focus()
    }
  }

  const item = (to: string, label: string) => (
    <MenuItem key={to} size="sm" role="none">
      <MenuLink to={to} role="menuitem" tabIndex={-1} onClick={() => setOpen(false)}>{label}</MenuLink>
    </MenuItem>
  )

  const byGroup = new Map(CATEGORIES_BY_GROUP)

  return (
    <DropdownWrap ref={wrapRef}>
      <NavButton
        ref={buttonRef}
        variant={active || open ? 'raised' : 'flat'}
        active={open}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="products-menu"
        onClick={(e) => {
          // Keyboard activation (Enter/Space) moves focus into the menu, per the menu-button pattern.
          if (!open && e.detail === 0) focusOnOpen.current = 'first'
          setOpen((o) => !o)
        }}
        onKeyDown={onButtonKey}
      >
        Browse Parts ▾
      </NavButton>
      {open && (
        <Dropdown id="products-menu" ref={menuRef} aria-label="Part categories" onKeyDown={onMenuKey}>
          {MENU_COLUMNS.map((groups, ci) => (
            <Column key={ci} role="none">
              {groups.map((g) => (
                <GroupList key={g} role="group" aria-label={g}>
                  <GroupHeading role="presentation">{g}</GroupHeading>
                  {(byGroup.get(g) ?? []).map((c) => item(productsPath(c.id), c.plural))}
                </GroupList>
              ))}
            </Column>
          ))}
          <MenuFooter role="none">
            <Separator style={{ margin: '2px 0 4px' }} />
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} role="none">
              {item('/products', 'All parts →')}
              {item(TRENDS_LINK.to, `${TRENDS_LINK.label} →`)}
            </ul>
          </MenuFooter>
        </Dropdown>
      )}
    </DropdownWrap>
  )
}

// ---------- current build summary ----------

const SummaryLink = styled(Link)`
  color: inherit;
  text-decoration: none;
  min-width: 0;
  &:focus-visible { outline: 1px dotted var(--win-text); outline-offset: 2px; }
`

const SummaryFrame = styled(Frame).attrs({ variant: 'field' })`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  white-space: nowrap;
  background: var(--win-window);
  color: var(--win-window-text);
  cursor: pointer;
`

const NameWrap = styled.span`
  display: flex;
  gap: 4px;
  min-width: 0;
  /* Between the collapse point and wide desktop, drop the name to keep the bar on one line. */
  @media (min-width: 1000px) and (max-width: 1279px) {
    display: none;
  }
`

const BuildName = styled.span`
  font-weight: 700;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
`

function OkIcon() {
  return (
    <span
      role="img"
      aria-label="Compatible"
      title="No compatibility problems found"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 14, height: 14, fontSize: 10, fontWeight: 700, lineHeight: 1,
        color: '#fff', background: '#008000', border: '1px solid #000', flexShrink: 0,
      }}
    >
      ✔
    </span>
  )
}

function BuildSummary({ compact }: { compact?: boolean }) {
  const build = useBuildStore((s) => s.build)
  const { errors, warnings } = useCompat()
  const totals = useMemo(() => getTrackingTotals(build), [build])
  const count = build.components.filter((c) => c.part).length

  const icon = errors.length > 0
    ? <CompatIcon severity="error" title={`${errors.length} compatibility error${errors.length > 1 ? 's' : ''}`} />
    : warnings.length > 0
      ? <CompatIcon severity="warning" title={`${warnings.length} compatibility warning${warnings.length > 1 ? 's' : ''}`} />
      : count > 0 ? <OkIcon /> : null

  const spent = `${formatPrice(totals.spent)}${totals.unrecorded > 0 ? '+' : ''}`
  const toBuy = `${formatPrice(totals.toBuy)}${totals.toBuyUnpriced > 0 ? '+' : ''}`
  const name = build.name?.trim() || 'My Build'
  const label = `Builder: ${name}, ${count} part${count === 1 ? '' : 's'}, ${spent} spent, ${toBuy} still to buy${errors.length ? `, ${errors.length} compatibility errors` : ''}`

  return (
    <SummaryLink to="/build" aria-label={label} title={label}>
      <SummaryFrame>
        {icon}
        {!compact && <NameWrap><BuildName>{name}</BuildName><span>·</span></NameWrap>}
        {!compact && <span>{count} part{count === 1 ? '' : 's'} ·</span>}
        {compact
          ? <strong>{toBuy} to buy</strong>
          : <span>Spent <strong>{spent}</strong> · To buy <strong>{toBuy}</strong></span>}
      </SummaryFrame>
    </SummaryLink>
  )
}

// ---------- display properties ----------

/** Monitor icon whose screen shows the current desktop color — opens Display Properties. */
function DisplayButton() {
  const setOpen = useDisplayProperties((s) => s.setOpen)
  return (
    <Button
      variant="flat"
      square
      onClick={() => setOpen(true)}
      aria-label="Display properties: change the color scheme"
      title="Display properties: change the color scheme"
      style={{ flexShrink: 0 }}
    >
      <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden style={{ display: 'block' }}>
        <rect x="1" y="1" width="16" height="11" style={{ fill: 'var(--win-face)', stroke: 'var(--win-text)' }} />
        <rect x="3" y="3" width="12" height="7" style={{ fill: 'var(--win-desktop)' }} />
        <rect x="4" y="4" width="6" height="2" style={{ fill: 'var(--win-title-solid)' }} />
        <path d="M6 13.5h6M4 15h10" style={{ stroke: 'var(--win-text)' }} />
      </svg>
    </Button>
  )
}

// ---------- bar ----------

export function TopBar() {
  const collapsed = useMediaQuery(COLLAPSE_QUERY)
  const phone = useMediaQuery(PHONE_QUERY)
  const { pathname } = useLocation()

  const link = (to: string, label: string) => (
    <TopLink key={to} to={to}>
      {({ isActive }) => (
        <NavButton forwardedAs="span" variant={isActive ? 'raised' : 'flat'} tabIndex={-1}>
          {label}
        </NavButton>
      )}
    </TopLink>
  )

  return (
    <AppBar position="sticky" style={{ top: 0, zIndex: 30 }}>
      <Toolbar style={{ justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          {collapsed && <MobileNav />}
          <BrandLink to="/">Pedal Parts Picker</BrandLink>

          {!collapsed && (
            <NavRow aria-label="Main">
              <Separator orientation="vertical" size="28px" style={{ marginRight: 2 }} />
              {TRACKER_LINKS.map((l) => link(l.to, l.label))}
              <Separator orientation="vertical" size="28px" style={{ margin: '0 2px' }} />
              <ProductsMenu active={isProductsPath(pathname) || pathname === TRENDS_LINK.to} />
              {RESEARCH_LINKS.map((l) => link(l.to, l.label))}
              {link(ABOUT_LINK.to, ABOUT_LINK.label)}
            </NavRow>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          {!phone && <AccountButton />}
          <DisplayButton />
          <BuildSummary compact={phone} />
        </div>
      </Toolbar>
    </AppBar>
  )
}
