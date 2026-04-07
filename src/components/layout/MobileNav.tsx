import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Drawer } from '@/components/ui/Drawer'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuthStore } from '@/store/authStore'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/build', label: 'Builder' },
    { to: '/garage', label: 'Garage' },
    { to: '/parts', label: 'Parts Bin' },
    { to: '/about', label: 'About' },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-bg-subtle"
        aria-label="Open navigation menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title="Pedal Parts Picker">
        <nav className="flex flex-col p-4 gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border-default p-4 flex items-center justify-between">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">{user?.displayName}</span>
              <button
                onClick={() => { logout(); setOpen(false) }}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/build"
              onClick={() => setOpen(false)}
              className="text-sm text-accent font-medium hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </Drawer>
    </>
  )
}
