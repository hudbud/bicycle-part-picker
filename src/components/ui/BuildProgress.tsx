import { memo } from 'react'
import { ProgressBar } from 'react95'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Label = styled.span`
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
`

interface BuildProgressProps {
  filled: number
  total: number
}

export const BuildProgress = memo(function BuildProgress({ filled, total }: BuildProgressProps) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0

  return (
    <Wrapper>
      <Label>{filled} of {total} components</Label>
      <ProgressBar
        value={pct}
        style={{ flex: 1, minWidth: 80 }}
      />
    </Wrapper>
  )
})
