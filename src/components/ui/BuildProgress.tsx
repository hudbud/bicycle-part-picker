import { memo } from 'react'

interface BuildProgressProps {
  filled: number
  total: number
}

export const BuildProgress = memo(function BuildProgress({ filled, total }: BuildProgressProps) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0

  const barColor =
    pct === 100
      ? 'bg-green-500'
      : pct >= 50
        ? 'bg-amber-500'
        : 'bg-accent'

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-text-secondary whitespace-nowrap">
        {filled} of {total} components
      </span>
      <div className="flex-1 h-1.5 bg-bg-subtle rounded-full overflow-hidden min-w-20">
        <div
          className={`h-full rounded-full transition-all duration-400 ${barColor}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={filled}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  )
})
