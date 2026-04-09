import type { PartStatus } from '@/types/build'

interface StatusBadgeProps {
  status: PartStatus
  className?: string
}

const STATUS_CONFIG: Record<PartStatus, { label: string; color: string }> = {
  owned:     { label: 'Owned',       color: 'var(--status-owned)' },
  purchased: { label: 'Purchased',   color: 'var(--status-purchased)' },
  partsbin:  { label: 'In Parts Bin', color: 'var(--status-partsbin)' },
  wanted:    { label: 'Wanted',      color: 'var(--status-wanted)' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 6px',
        fontSize: 11,
        fontWeight: 700,
        border: `2px solid ${config.color}`,
        color: config.color,
        background: 'transparent',
        fontFamily: 'ms_sans_serif, sans-serif',
      }}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
