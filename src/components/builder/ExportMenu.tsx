import { useState } from 'react'
import { useBuildExport } from '@/hooks/useBuildExport'
import { Popover } from '@/components/ui/Popover'
import { Button } from '@/components/ui/Button'

export function ExportMenu() {
  const [open, setOpen] = useState(false)
  const { downloadText, downloadCsv, downloadJson } = useBuildExport()

  const options = [
    { label: 'Text (.txt)', action: downloadText },
    { label: 'CSV (.csv)', action: downloadCsv },
    { label: 'JSON (.json)', action: downloadJson },
  ]

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
          Export
          <svg className="w-3.5 h-3.5 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      }
      className="right-0 bottom-full mb-1"
    >
      <div className="py-1">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => { opt.action(); setOpen(false) }}
            className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Popover>
  )
}
