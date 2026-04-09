import type React from 'react'
import type { BikeType } from '@/types/build'

interface BikeTypePillProps {
  type: BikeType
  className?: string
  style?: React.CSSProperties
}

const TYPE_CONFIG: Record<BikeType, { label: string; color: string }> = {
  road:   { label: 'Road',   color: '#3b82f6' },
  mtb:    { label: 'MTB',    color: '#22c55e' },
  gravel: { label: 'Gravel', color: '#f59e0b' },
  track:  { label: 'Track',  color: '#a855f7' },
  bmx:    { label: 'BMX',    color: '#ef4444' },
  other:  { label: 'Other',  color: '#6b7280' },
}

export function BikeTypePill({ type, className }: BikeTypePillProps) {
  const config = TYPE_CONFIG[type]
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
        fontFamily: 'ms_sans_serif, sans-serif',
      }}
    >
      {config.label}
    </span>
  )
}
