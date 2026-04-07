interface PartSearchProps {
  value: string
  onChange: (v: string) => void
}

export function PartSearch({ value, onChange }: PartSearchProps) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search parts…"
        className="w-full pl-9 pr-3 py-2 text-sm bg-bg-subtle border border-border-default rounded-lg text-text-primary placeholder-text-muted outline-none focus:border-accent transition-colors"
        autoFocus
      />
    </div>
  )
}
