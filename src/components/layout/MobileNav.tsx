import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Button, MenuList, MenuListItem, Separator } from 'react95'
import styled from 'styled-components'
import { useAuthStore } from '@/store/authStore'
import { Drawer } from '@/components/ui/Drawer'

const NavItem = styled(MenuListItem)`
  font-size: 13px;
`

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()

  const navLinks = [
    { to: '/',       label: 'Home' },
    { to: '/build',  label: 'Builder' },
    { to: '/garage', label: 'Garage' },
    { to: '/parts',  label: 'Parts Bin' },
    { to: '/about',  label: 'About' },
  ]

  return (
    <>
      <Button variant="flat" onClick={() => setOpen(true)} aria-label="Open navigation menu" square>
        ☰
      </Button>

      <Drawer open={open} onClose={() => setOpen(false)} title="Pedal Parts Picker">
        <MenuList fullWidth>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setOpen(false)}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              {({ isActive }) => (
                <NavItem size="md" style={{ fontWeight: isActive ? 700 : 400 }}>
                  {link.label}
                </NavItem>
              )}
            </NavLink>
          ))}
          <Separator />
          {isAuthenticated ? (
            <>
              <NavItem size="md" disabled>{user?.displayName}</NavItem>
              <NavItem size="md" onClick={() => { logout(); setOpen(false) }}>
                Sign out
              </NavItem>
            </>
          ) : (
            <NavItem size="md" onClick={() => setOpen(false)}>
              Sign in
            </NavItem>
          )}
        </MenuList>
      </Drawer>
    </>
  )
}
