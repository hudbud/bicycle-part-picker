import type { Part } from '@/types/parts'

interface PartCardProps {
  part: Part
  selected?: boolean
  onSelect: (part: Part) => void
}

export function PartCard({ part, selected, onSelect }: PartCardProps) {
  return (
    <button
      onClick={() => onSelect(part)}
      className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition-colors border-b border-border-default last:border-b-0 hover:bg-bg-subtle ${
        selected ? 'bg-accent/10' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-text-primary truncate">{part.name}</span>
          {selected && (
            <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <p className="text-xs text-text-muted mt-0.5">{part.brand}</p>
        {part.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {part.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-muted border border-border-default"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        {part.price ? (
          <span className="text-sm font-medium text-text-primary">
            ${part.price.toLocaleString()}
          </span>
        ) : (
          <span className="text-sm text-text-muted">—</span>
        )}
      </div>
    </button>
  )
}
