import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LandingPage } from '@/pages/LandingPage'
import { BuilderPage } from '@/pages/BuilderPage'
import { SharedBuildPage } from '@/pages/SharedBuildPage'
import { GaragePage } from '@/pages/GaragePage'
import { PartsPage } from '@/pages/PartsPage'
import { AboutPage } from '@/pages/AboutPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/build" element={<BuilderPage />} />
          <Route path="/build/:buildId" element={<SharedBuildPage />} />
          <Route path="/garage" element={<GaragePage />} />
          <Route path="/parts" element={<PartsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
