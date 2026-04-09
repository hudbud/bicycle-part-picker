import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { AppBar, Toolbar, Button, Separator } from 'react95'
import styled from 'styled-components'
import { useAuthStore } from '@/store/authStore'
import { AuthModal } from '@/components/auth/AuthModal'
import { MobileNav } from './MobileNav'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 13px;
  color: inherit;
  text-decoration: none;
  margin-right: 4px;
`

const NavButton = styled(Button).attrs({ variant: 'flat' })`
  font-size: 12px;
`

const ActiveNavButton = styled(Button).attrs({ variant: 'raised' })`
  font-size: 12px;
`

export function TopBar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [showAuth, setShowAuth] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const navLinks = [
    { to: '/build',  label: 'Builder' },
    { to: '/garage', label: 'Garage' },
    { to: '/parts',  label: 'Parts Bin' },
    { to: '/about',  label: 'About' },
  ]

  return (
    <>
      <AppBar position="sticky" style={{ top: 0, zIndex: 30 }}>
        <Toolbar style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <BrandLink to="/">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <circle cx="8"  cy="22" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                <circle cx="24" cy="22" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                <path d="M8 22 L14 8 L20 14 L24 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M14 8 L24 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="24" cy="8" r="1.5" fill="currentColor"/>
              </svg>
              {!isMobile && 'Pedal Parts Picker'}
            </BrandLink>

            {!isMobile && (
              <>
                <Separator orientation="vertical" size="md" />
                {navLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                    {({ isActive }) =>
                      isActive
                        ? <ActiveNavButton>{link.label}</ActiveNavButton>
                        : <NavButton>{link.label}</NavButton>
                    }
                  </NavLink>
                ))}
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {!isMobile && (
              isAuthenticated ? (
                <>
                  <span style={{ fontSize: 12, marginRight: 4 }}>{user?.displayName}</span>
                  <Button variant="flat" onClick={logout} style={{ fontSize: 12 }}>
                    Sign out
                  </Button>
                </>
              ) : (
                <Button variant="flat" onClick={() => setShowAuth(true)} style={{ fontSize: 12 }}>
                  Sign in
                </Button>
              )
            )}
            {isMobile && <MobileNav />}
          </div>
        </Toolbar>
      </AppBar>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}
