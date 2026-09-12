import { BuildHeader } from '@/components/builder/BuildHeader'
import { ComponentTable } from '@/components/builder/ComponentTable'
import { BuilderFooter } from '@/components/builder/BuilderFooter'
import { Window, WindowHeader, WindowContent } from 'react95'
import styled from 'styled-components'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
`

export function BuilderPage() {
  return (
    <div style={{ paddingBottom: 60 }}>
      <PageWindow>
        <WindowHeader active>
          <span>Pedal Parts Picker — Builder</span>
        </WindowHeader>
        <WindowContent>
          <BuildHeader />
          <ComponentTable />
        </WindowContent>
      </PageWindow>
      <BuilderFooter />
    </div>
  )
}
