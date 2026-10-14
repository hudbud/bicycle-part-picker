import type { PartCondition } from '@/types/build'
import { conditionMeta } from './conditions'

interface ConditionBadgeProps {
  condition: PartCondition | undefined
  /** Shorter label ("Used·good") for tight table cells. */
  short?: boolean
  style?: React.CSSProperties
}

/** Bordered condition chip (New / NOS / Used – good / Used – fair / Needs work), same idiom as StatusBadge. */
export function ConditionBadge({ condition, short, style }: ConditionBadgeProps) {
  if (!condition) return null
  const m = conditionMeta(condition)
  return (
    <span
      title={m.title}
      aria-label={`Condition: ${m.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 5px',
        fontSize: 11,
        lineHeight: '15px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        border: `1px solid ${m.color}`,
        color: m.color,
        background: '#fff',
        fontFamily: 'ms_sans_serif, sans-serif',
        ...style,
      }}
    >
      {short ? m.short : m.label}
    </span>
  )
}
