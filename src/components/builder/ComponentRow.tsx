import { useState } from 'react'
import type { ComponentSlot } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import type { PartStatus } from '@/types/build'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Popover } from '@/components/ui/Popover'
import { useBuildStore } from '@/store/buildStore'
import { useToast } from '@/hooks/useToast'

interface ComponentRowProps {
  slot: ComponentSlot
  label: string
  onClickRow: (category: PartCategory) => void
  isEven: boolean
}

const STATUSES: PartStatus[] = ['owned', 'purchased', 'partsbin', 'wanted']

export function ComponentRow({ slot, label, onClickRow, isEven }: ComponentRowProps) {
  const { removePart, setPartStatus, clearPartStatus } = useBuildStore()
  const { success } = useToast()
  const [statusOpen, setStatusOpen] = useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removePart(slot.category)
    success('Part removed')
  }

  const handleStatusChange = (status: PartStatus) => {
    setPartStatus(slot.category, status)
    setStatusOpen(false)
  }

  return (
    <tr
      className={`cursor-pointer transition-colors duration-150 hover:bg-accent/5 ${isEven ? 'bg-bg-subtle/40' : ''}`}
      onClick={() => onClickRow(slot.category)}
    >
      <td className="px-4 py-3 text-sm font-medium text-text-secondary whitespace-nowrap w-40">
        {label}
      </td>
      <td className="px-4 py-3 min-w-0">
        {slot.part ? (
          <div>
            <span className="text-sm font-medium text-text-primary">{slot.part.brand} {slot.part.name}</span>
            {slot.part.isCustom && (
              <span className="ml-2 text-xs text-text-muted">(custom)</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-text-muted italic">Choose a part…</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-text-primary whitespace-nowrap w-24 text-right">
        {slot.part?.price ? `$${slot.part.price.toLocaleString()}` : <span className="text-text-muted">—</span>}
      </td>
      <td className="px-4 py-3 w-32" onClick={(e) => e.stopPropagation()}>
        {slot.part && (
          <Popover
            open={statusOpen}
            onClose={() => setStatusOpen(false)}
            trigger={
              <button
                onClick={(e) => { e.stopPropagation(); setStatusOpen(!statusOpen) }}
                className="focus-visible:outline-none"
              >
                {slot.status ? (
                  <StatusBadge status={slot.status} />
                ) : (
                  <span className="text-xs text-text-muted hover:text-text-secondary transition-colors">Set status</span>
                )}
              </button>
            }
          >
            <div className="py-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-bg-subtle transition-colors"
                >
                  <StatusBadge status={s} />
                </button>
              ))}
              {slot.status && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearPartStatus(slot.category); setStatusOpen(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-muted hover:bg-bg-subtle transition-colors border-t border-border-default mt-1"
                >
                  Clear status
                </button>
              )}
            </div>
          </Popover>
        )}
      </td>
      <td className="px-4 py-3 w-12 text-right" onClick={(e) => e.stopPropagation()}>
        {slot.part ? (
          <button
            onClick={handleRemove}
            className="text-text-muted hover:text-red-500 transition-colors p-1 rounded"
            aria-label={`Remove ${slot.part.name}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onClickRow(slot.category) }}
            className="text-accent hover:text-accent-hover transition-colors p-1 rounded"
            aria-label={`Add ${label}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </td>
    </tr>
  )
}
