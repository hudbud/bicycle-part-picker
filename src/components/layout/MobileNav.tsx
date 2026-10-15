import { Fragment, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { MenuList, MenuListItem, Button, Separator } from 'react95'
import styled from 'styled-components'
import { Drawer } from '@/components/ui/Drawer'
import { BROWSABLE_CATEGORIES, CATEGORY_GROUPS, productsPath } from '@/data/categoryConfig'
import type { CategoryGroup, CategoryMeta } from '@/data/categoryConfig'
import { useAccountStore } from '@/account/accountStore'
import { useAccountActions } from '@/components/account/AccountButton'

export interface NavLinkDef { to: string; label: string }

/** The tracker itself — first in the header and the drawer. */
export const TRACKER_LINKS: NavLinkDef[] = [
  { to: '/garage', label: 'Garage' },
  { to: '/build', label: 'Builder' },
  { to: '/parts', label: 'Parts Bin' },
]

/**
 * Browse / research, after the "Products" dropdown. Price Trends is deliberately not in the
 * header row (it's in the Products menu and the drawer) — prices are a supporting feature.
 */
export const RESEARCH_LINKS: NavLinkDef[] = [
  { to: '/guides', label: 'Build Guides' },
  { to: '/builds', label: 'Completed Builds' },
]

export const TRENDS_LINK: NavLinkDef = { to: '/trends', label: 'Price Trends' }
export const ABOUT_LINK: NavLinkDef = { to: '/about', label: 'About' }

/** Everything in the header row, in order (Products dropdown sits between the two groups). */
export const NAV_LINKS: NavLinkDef[] = [...TRACKER_LINKS, ...RESEARCH_LINKS, ABOUT_LINK]

/** Browsable categories bucketed by group, in CATEGORY_GROUPS order. */
export const CATEGORIES_BY_GROUP: [CategoryGroup, CategoryMeta[]][] = CATEGORY_GROUPS.map((g) => [
  g,
  BROWSABLE_CATEGORIES.filter((c) => c.group === g),
])

export function isProductsPath(pathname: string): boolean {
  return pathname === '/products' || pathname.startsWith('/products/') || pathname.startsWith('/product/') || pathname.startsWith('/compare')
}

const NavItem = styled(MenuListItem)`
  font-size: 13px;
`

const SubItem = styled(MenuListItem)`
  font-size: 12px;
  & > a { padding-left: 28px !important; }
`

const GroupLabel = styled.li`
  font-size: 11px;
  font-weight: 700;
  color: var(--win-link);
  padding: 6px 8px 2px 20px;
  list-style: none;
`

const linkStyle = { textDecoration: 'none', display: 'flex', alignItems: 'center', alignSelf: 'stretch', flex: 1, padding: '0 8px', color: 'inherit' } as const

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const [productsOpen, setProductsOpen] = useState(() => isProductsPath(pathname))
  const close = () => setOpen(false)
  const account = useAccountStore()
  const accountActions = useAccountActions()

  const action = (label: string, onClick: () => void) => (
    <NavItem
      size="sm"
      role="menuitem"
      tabIndex={0}
      onClick={() => { close(); onClick() }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); onClick() } }}
      style={{ cursor: 'pointer' }}
    >
      {label}
    </NavItem>
  )

  const renderLink = (to: string, label: string, Item: typeof NavItem = NavItem, end = false) => (
    <Item key={to} size="sm" role="none" style={{ padding: 0 }}>
      <NavLink to={to} end={end} role="menuitem" onClick={close} style={({ isActive }) => ({ ...linkStyle, fontWeight: isActive ? 700 : 400 })}>
        {label}
      </NavLink>
    </Item>
  )

  return (
    <>
      <Button variant="flat" onClick={() => setOpen(true)} aria-label="Open navigation menu" square>
        ☰
      </Button>

      <Drawer open={open} onClose={close} title="Pedal Parts Picker">
        <MenuList fullWidth inline={false} shadow={false} style={{ display: 'block' }}>
          {renderLink('/', 'Home', NavItem, true)}
          <GroupLabel role="presentation" style={{ paddingLeft: 8 }}>Your bikes &amp; parts</GroupLabel>
          {TRACKER_LINKS.map((l) => renderLink(l.to, l.label, NavItem, l.to === '/build'))}
          <li role="separator" style={{ listStyle: 'none', margin: '4px 0' }}><Separator /></li>
          <GroupLabel role="presentation" style={{ paddingLeft: 8 }}>Browse &amp; research</GroupLabel>
          <NavItem
            size="sm"
            role="menuitem"
            tabIndex={0}
            aria-expanded={productsOpen}
            onClick={() => setProductsOpen((o) => !o)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProductsOpen((o) => !o) }
            }}
            style={{ fontWeight: isProductsPath(pathname) ? 700 : 400, cursor: 'pointer', justifyContent: 'space-between' }}
          >
            <span>Browse Parts</span>
            <span aria-hidden="true">{productsOpen ? '▾' : '▸'}</span>
          </NavItem>
          {productsOpen && (
            <>
              {renderLink('/products', 'All parts', SubItem, true)}
              {CATEGORIES_BY_GROUP.map(([group, cats]) => (
                <Fragment key={group}>
                  <GroupLabel role="presentation">{group}</GroupLabel>
                  {cats.map((c) => renderLink(productsPath(c.id), c.plural, SubItem))}
                </Fragment>
              ))}
              <li role="separator" style={{ listStyle: 'none', margin: '4px 0' }}><Separator /></li>
            </>
          )}
          {[...RESEARCH_LINKS, TRENDS_LINK].map((l) => renderLink(l.to, l.label))}
          <li role="separator" style={{ listStyle: 'none', margin: '4px 0' }}><Separator /></li>
          {renderLink(ABOUT_LINK.to, ABOUT_LINK.label)}
          {account.available && (
            <>
              <li role="separator" style={{ listStyle: 'none', margin: '4px 0' }}><Separator /></li>
              {account.user ? (
                <>
                  <GroupLabel role="presentation" style={{ paddingLeft: 8 }}>{account.user.email || account.user.name}</GroupLabel>
                  {action('Sign out', accountActions.signOut)}
                  {action('Sign out & clear this browser…', accountActions.askClear)}
                  {action('Delete account…', accountActions.askDelete)}
                </>
              ) : (
                action('Sign in', () => account.setSignInOpen(true))
              )}
            </>
          )}
        </MenuList>
      </Drawer>
      {accountActions.dialogs}
    </>
  )
}
