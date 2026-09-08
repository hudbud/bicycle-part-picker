import { NavLink, Link } from 'react-router-dom'
import { AppBar, Toolbar, Button, Separator } from 'react95'
import styled from 'styled-components'
import { MobileNav } from './MobileNav'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
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
  const isMobile = useMediaQuery('(max-width: 768px)')

  const navLinks = [
    { to: '/build',  label: 'Builder' },
    { to: '/garage', label: 'Garage' },
    { to: '/parts',  label: 'Parts Bin' },
    { to: '/about',  label: 'About' },
  ]

  return (
    <AppBar position="sticky" style={{ top: 0, zIndex: 30 }}>
      <Toolbar style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BrandLink to="/">
            Pedal Parts Picker
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

        {isMobile && <MobileNav />}
      </Toolbar>
    </AppBar>
  )
}
