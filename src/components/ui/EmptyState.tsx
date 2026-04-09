import type { ReactNode } from 'react'
import { Frame } from 'react95'
import styled from 'styled-components'
import { Button } from './Button'

const Well = styled(Frame).attrs({ variant: 'field' })`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
  width: 100%;
`

interface EmptyStateProps {
  icon?: ReactNode
  heading: string
  subtext?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, heading, subtext, action }: EmptyStateProps) {
  return (
    <Well>
      {icon && <div style={{ opacity: 0.5, width: 48, height: 48 }}>{icon}</div>}
      <div>
        <p style={{ fontWeight: 700 }}>{heading}</p>
        {subtext && <p style={{ fontSize: 12, marginTop: 4 }}>{subtext}</p>}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Well>
  )
}
