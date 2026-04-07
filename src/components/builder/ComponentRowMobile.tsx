import type { ComponentSlot } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useBuildStore } from '@/store/buildStore'
import { useToast } from '@/hooks/useToast'

interface ComponentRowMobileProps {
  slot: ComponentSlot
  label: string
  onClickRow: (category: PartCategory) => void
}

export function ComponentRowMobile({ slot, label, onClickRow }: ComponentRowMobileProps) {
  const { removePart } = useBuildStore()
  const { success } = useToast()

  return (
    <div
      className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border-default cursor-pointer hover:bg-bg-subtle transition-colors"
      onClick={() => onClickRow(slot.category)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted uppercase tracking-wide">{label}</span>
          {slot.part?.price && (
            <span className="text-sm font-medium text-text-primary">${slot.part.price.toLocaleString()}</span>
          )}
        </div>
        {slot.part ? (
          <div className="mt-0.5">
            <span className="text-sm font-medium text-text-primary">{slot.part.brand} {slot.part.name}</span>
            {slot.status && (
              <div className="mt-1">
                <StatusBadge status={slot.status} />
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-text-muted italic">Tap to choose a part…</span>
        )}
      </div>
      {slot.part && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            removePart(slot.category)
            success('Part removed')
          }}
          className="text-text-muted hover:text-red-500 transition-colors p-1 flex-shrink-0"
          aria-label={`Remove ${slot.part.name}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
