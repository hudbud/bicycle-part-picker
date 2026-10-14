import { useSettingsStore } from '@/store/settingsStore'
import { formatDistance } from '@/utils/distance'
import type { DueHint } from './serviceDue'

/** Row of yellow ("soon") / red ("due") maintenance chips. Nothing when all's well. */
export function DueHints({ hints }: { hints: DueHint[] }) {
  const unit = useSettingsStore((s) => s.distanceUnit)
  if (hints.length === 0) return null
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
      {hints.map((h) => (
        <span
          key={h.key}
          title={h.km != null ? `${formatDistance(h.km, unit)} on this part` : undefined}
          style={{
            fontSize: 11,
            fontWeight: 700,
            lineHeight: '15px',
            padding: '0 5px',
            border: '1px solid #000',
            whiteSpace: 'nowrap',
            background: h.level === 'due' ? '#c00000' : '#ffd400',
            color: h.level === 'due' ? '#fff' : '#000',
          }}
        >
          {h.level === 'due' ? '⚠ ' : ''}{h.label}
          {h.km != null && <span style={{ fontWeight: 400 }}> · {formatDistance(h.km, unit)}</span>}
        </span>
      ))}
    </span>
  )
}
