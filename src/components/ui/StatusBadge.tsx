import type { PartStatus } from '@/types/build'

interface StatusBadgeProps {
  status: PartStatus
  className?: string
}

const STATUS_CONFIG: Record<PartStatus, { label: string; className: string }> = {
  owned: { label: 'Owned', className: 'bg-green-500/20 text-status-owned border border-green-500/30' },
  purchased: { label: 'Purchased', className: 'bg-blue-500/20 text-status-purchased border border-blue-500/30' },
  partsbin: { label: 'In Parts Bin', className: 'bg-amber-500/20 text-status-partsbin border border-amber-500/30' },
  wanted: { label: 'Wanted', className: 'bg-purple-500/20 text-status-wanted border border-purple-500/30' },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className} ${className}`}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
