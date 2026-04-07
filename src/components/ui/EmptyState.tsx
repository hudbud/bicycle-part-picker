import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  heading: string
  subtext?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, heading, subtext, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {icon && (
        <div className="text-text-muted opacity-60 w-12 h-12">{icon}</div>
      )}
      <div className="space-y-1">
        <p className="font-medium text-text-primary">{heading}</p>
        {subtext && <p className="text-sm text-text-secondary">{subtext}</p>}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
