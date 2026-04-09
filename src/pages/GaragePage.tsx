import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGarageStore } from '@/store/garageStore'
import { useAuthStore } from '@/store/authStore'
import { BuildCard } from '@/components/garage/BuildCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { AuthModal } from '@/components/auth/AuthModal'
import { Button } from '@/components/ui/Button'
import { Window, WindowHeader, WindowContent } from 'react95'
import styled from 'styled-components'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
`

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
    </svg>
  )
}

export function GaragePage() {
  const { builds } = useGarageStore()
  const { isAuthenticated } = useAuthStore()
  const [showAuth, setShowAuth] = useState(false)

  if (!isAuthenticated) {
    return (
      <>
        <PageWindow>
          <WindowHeader active><span>My Garage</span></WindowHeader>
          <WindowContent>
            <EmptyState
              icon={<WrenchIcon />}
              heading="Sign in to view your garage"
              subtext="Save builds and access them from any device."
              action={{ label: 'Sign in', onClick: () => setShowAuth(true) }}
            />
          </WindowContent>
        </PageWindow>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </>
    )
  }

  return (
    <PageWindow>
      <WindowHeader active><span>My Garage</span></WindowHeader>
      <WindowContent>
        <HeaderRow>
          <span style={{ fontSize: 13 }}>{builds.length} saved build{builds.length !== 1 ? 's' : ''}</span>
          <Link to="/build" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm">+ New Build</Button>
          </Link>
        </HeaderRow>
        {builds.length === 0 ? (
          <EmptyState
            icon={<WrenchIcon />}
            heading="No saved builds yet"
            subtext="Start planning your dream build and save it here."
            action={{ label: 'Start Building', onClick: () => window.location.assign('/build') }}
          />
        ) : (
          <Grid>
            {builds.map((build) => (
              <BuildCard key={build.id} build={build} />
            ))}
          </Grid>
        )}
      </WindowContent>
    </PageWindow>
  )
}
