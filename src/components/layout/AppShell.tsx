import type { ReactNode } from 'react'
import styled from 'styled-components'
import { AppBar } from 'react95'
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

const StatusBar = styled(AppBar).attrs({ position: 'sticky' })`
  bottom: 0;
  top: auto;
  font-size: 11px;
  padding: 2px 8px;
  display: flex;
  align-items: center;
`

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Desktop>
      <TopBar />
      <Main>{children}</Main>
      <StatusBar>
        <span>Pedal Parts Picker — Ready</span>
      </StatusBar>
      <ToastContainer />
    </Desktop>
  )
}
