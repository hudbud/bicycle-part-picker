import { Window, WindowHeader, WindowContent } from 'react95'
import styled from 'styled-components'
import { EmptyState } from '@/components/ui/EmptyState'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
`

export function NotFoundPage() {
  return (
    <PageWindow>
      <WindowHeader active><span>404 — Page Not Found</span></WindowHeader>
      <WindowContent>
        <EmptyState
          heading="Nothing here"
          subtext="That page doesn't exist."
          action={{ label: 'Go home', onClick: () => window.location.assign('/') }}
        />
      </WindowContent>
    </PageWindow>
  )
}
