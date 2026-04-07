import type { BikeType } from '@/types/build'

interface BikeTypePillProps {
  type: BikeType
  className?: string
}

const TYPE_CONFIG: Record<BikeType, { label: string; className: string }> = {
  road: { label: 'Road', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  mtb: { label: 'MTB', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  gravel: { label: 'Gravel', className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  track: { label: 'Track', className: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
  bmx: { label: 'BMX', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  other: { label: 'Other', className: 'bg-bg-subtle text-text-secondary border border-border-default' },
}

export function BikeTypePill({ type, className = '' }: BikeTypePillProps) {
  const config = TYPE_CONFIG[type]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
