import type { ReactNode } from 'react'
import styled from 'styled-components'
import { TopBar } from './TopBar'
import { ToastContainer } from '@/components/ui/Toast'

const Desktop = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => (theme as any).desktopBackground ?? '#008080'};
`

const Main = styled.main`
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
`

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Desktop>
      <TopBar />
      <Main>{children}</Main>
      <ToastContainer />
    </Desktop>
  )
}
