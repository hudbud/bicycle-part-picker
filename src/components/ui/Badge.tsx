import type { ReactNode } from 'react'
import { Frame } from 'react95'
import styled from 'styled-components'

const InlineBadge = styled(Frame).attrs({ variant: 'status' })`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 700;
`

interface BadgeProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Badge({ children, className, style }: BadgeProps) {
  return (
    <InlineBadge className={className} style={style}>
      {children}
    </InlineBadge>
  )
}
