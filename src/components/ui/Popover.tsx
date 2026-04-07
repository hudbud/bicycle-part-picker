import { useEffect, useRef, type ReactNode } from 'react'

interface PopoverProps {
  open: boolean
  onClose: () => void
  trigger: ReactNode
  children: ReactNode
  className?: string
}

export function Popover({ open, onClose, trigger, children, className = '' }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <div ref={ref} className="relative inline-block">
      {trigger}
      {open && (
        <div
          className={`absolute z-40 mt-1 bg-bg-surface border border-border-default rounded-lg shadow-xl min-w-36 ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
