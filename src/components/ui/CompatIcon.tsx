import type { IssueSeverity } from '@/compat/engine'

export const SEVERITY_STYLE: Record<IssueSeverity, { color: string; bg: string; icon: string; label: string }> = {
  error:   { color: '#fff', bg: '#c00000', icon: '✖', label: 'Incompatible' },
  warning: { color: '#000', bg: '#ffd400', icon: '!', label: 'Warning' },
  note:    { color: '#fff', bg: '#000080', icon: 'i', label: 'Note' },
}

/** Small square severity marker used in tables, issue lists and browse rows. */
export function CompatIcon({ severity, title }: { severity: IssueSeverity; title?: string }) {
  const s = SEVERITY_STYLE[severity]
  return (
    <span
      title={title ?? s.label}
      aria-label={title ?? s.label}
      role="img"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 14,
        height: 14,
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
        color: s.color,
        background: s.bg,
        border: '1px solid #000',
        flexShrink: 0,
      }}
    >
      {s.icon}
    </span>
  )
}
