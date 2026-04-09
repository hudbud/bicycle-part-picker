import { BuildHeader } from '@/components/builder/BuildHeader'
import { ComponentTable } from '@/components/builder/ComponentTable'
import { BuilderFooter } from '@/components/builder/BuilderFooter'
import { EmptyState } from '@/components/ui/EmptyState'
import { useBuildStore } from '@/store/buildStore'
import { getCategoriesForBikeType } from '@/data/categoryConfig'
import { Window, WindowHeader, WindowContent } from 'react95'
import styled from 'styled-components'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
`

function BikeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48 }}>
      <circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 17l4-7 5 3 3-3M13 7h5"/>
      <circle cx="18" cy="7" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

export function BuilderPage() {
  const { build, getFilledCount } = useBuildStore()
  const categories = getCategoriesForBikeType(build.bikeType)
  const hasNoParts = getFilledCount() === 0

  return (
    <div style={{ paddingBottom: 60 }}>
      <PageWindow>
        <WindowHeader active>
          <span>Pedal Parts Picker — Builder</span>
        </WindowHeader>
        <WindowContent>
          <BuildHeader />
          {hasNoParts && categories.length > 0 && (
            <EmptyState
              icon={<BikeIcon />}
              heading="Start by choosing a frame"
              subtext="Click any row in the table to browse and select parts for your build."
            />
          )}
          <ComponentTable />
        </WindowContent>
      </PageWindow>
      <BuilderFooter />
    </div>
  )
}
