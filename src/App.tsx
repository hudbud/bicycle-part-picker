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
import { ProductsIndexPage } from '@/pages/ProductsIndexPage'
import { ProductBrowsePage } from '@/pages/ProductBrowsePage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { ComparePage } from '@/pages/ComparePage'
import { GuidesPage } from '@/pages/GuidesPage'
import { GuideDetailPage } from '@/pages/GuideDetailPage'
import { CompletedBuildsPage } from '@/pages/CompletedBuildsPage'
import { CompletedBuildDetailPage } from '@/pages/CompletedBuildDetailPage'
import { TrendsPage } from '@/pages/TrendsPage'

function RoutedContent() {
  const location = useLocation()
  return (
    // Keying by pathname resets the boundary when the user navigates away from a broken page.
    <ErrorBoundary key={location.pathname + location.search}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/build" element={<BuilderPage />} />
        <Route path="/build/:buildId" element={<SharedBuildPage />} />
        <Route path="/products" element={<ProductsIndexPage />} />
        <Route path="/products/:slug" element={<ProductBrowsePage />} />
        <Route path="/product/:partId" element={<ProductDetailPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/:guideId" element={<GuideDetailPage />} />
        <Route path="/builds" element={<CompletedBuildsPage />} />
        <Route path="/builds/:buildId" element={<CompletedBuildDetailPage />} />
        <Route path="/trends" element={<TrendsPage />} />
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
