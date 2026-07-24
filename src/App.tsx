import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { LandingPage } from '@/pages/LandingPage'
import { BuilderPage } from '@/pages/BuilderPage'
import { SharedBuildPage } from '@/pages/SharedBuildPage'
import { GaragePage } from '@/pages/GaragePage'
import { PartsPage } from '@/pages/PartsPage'
import { AboutPage } from '@/pages/AboutPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function RoutedContent() {
  const location = useLocation()
  return (
    // Keying by pathname resets the boundary when the user navigates away from a broken page.
    <ErrorBoundary key={location.pathname + location.search}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/build" element={<BuilderPage />} />
        <Route path="/build/:buildId" element={<SharedBuildPage />} />
        <Route path="/garage" element={<GaragePage />} />
        <Route path="/parts" element={<PartsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <RoutedContent />
      </AppShell>
    </BrowserRouter>
  )
}
