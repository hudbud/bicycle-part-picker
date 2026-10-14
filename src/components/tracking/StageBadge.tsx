import type { BuildStage } from '@/types/build'
import { stageMeta } from './serviceKinds'

/** Planning / Building / Riding / Retired chip. Renders nothing for bikes with no stage set. */
export function StageBadge({ stage }: { stage: BuildStage | undefined }) {
  const m = stageMeta(stage)
  if (!m) return null
  return (
    <span
      aria-label={`Stage: ${m.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 5px',
        fontSize: 11,
        lineHeight: '15px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: '#fff',
        background: m.color,
        border: '1px solid #000',
      }}
    >
      {m.label}
    </span>
  )
}
