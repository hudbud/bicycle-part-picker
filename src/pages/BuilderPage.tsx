import { BuildHeader } from '@/components/builder/BuildHeader'
import { ComponentTable } from '@/components/builder/ComponentTable'
import { BuilderFooter } from '@/components/builder/BuilderFooter'
import { EmptyState } from '@/components/ui/EmptyState'
import { useBuildStore } from '@/store/buildStore'
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
  const { getFilledCount } = useBuildStore()
  const hasNoParts = getFilledCount() === 0

  return (
    <div style={{ paddingBottom: 60 }}>
      <PageWindow>
        <WindowHeader active>
          <span>Pedal Parts Picker — Builder</span>
        </WindowHeader>
        <WindowContent>
          <BuildHeader />
          {hasNoParts && (
            <EmptyState
              heading="Add parts to get started"
              subtext="Click any row to enter a part name, brand, price, and link."
            />
          )}
          <ComponentTable />
        </WindowContent>
      </PageWindow>
      <BuilderFooter />
    </div>
  )
}
