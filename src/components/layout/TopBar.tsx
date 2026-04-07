import { NavLink, Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MobileNav } from './MobileNav'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { AuthModal } from '@/components/auth/AuthModal'

export function TopBar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [showAuth, setShowAuth] = useState(false)

  const navLinks = [
    { to: '/build', label: 'Builder' },
    { to: '/garage', label: 'Garage' },
    { to: '/parts', label: 'Parts Bin' },
    { to: '/about', label: 'About' },
  ]

  return (
    <>
      <header className="sticky top-0 z-30 bg-bg-surface/95 backdrop-blur border-b border-border-default">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-semibold text-text-primary hover:text-accent transition-colors">
              <svg className="w-6 h-6 text-accent" viewBox="0 0 32 32" fill="none">
                <circle cx="8" cy="22" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                <circle cx="24" cy="22" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                <path d="M8 22 L14 8 L20 14 L24 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M14 8 L24 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="24" cy="8" r="1.5" fill="currentColor"/>
              </svg>
              <span className="hidden sm:inline">Pedal Parts Picker</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'text-accent font-medium'
                        : 'text-text-secondary hover:text-text-primary'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-text-secondary">{user?.displayName}</span>
                <button
                  onClick={logout}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="hidden md:inline-flex text-sm font-medium text-accent hover:underline"
              >
                Sign in
              </button>
            )}
            <div className="md:hidden">
              <MobileNav />
            </div>
          </div>
        </div>
      </header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}
