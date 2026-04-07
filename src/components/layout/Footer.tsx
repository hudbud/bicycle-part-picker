import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-surface mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-medium text-text-primary">Pedal Parts Picker</p>
          <p className="text-sm text-text-muted mt-0.5">Built for cyclists, by cyclists.</p>
        </div>
        <nav className="flex gap-6 text-sm text-text-secondary">
          <Link to="/build" className="hover:text-text-primary transition-colors">Builder</Link>
          <Link to="/garage" className="hover:text-text-primary transition-colors">Garage</Link>
          <Link to="/about" className="hover:text-text-primary transition-colors">About</Link>
          <a href="https://github.com" className="hover:text-text-primary transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  )
}
