import { useState } from 'react'
import { useBuildExport } from '@/hooks/useBuildExport'
import { Popover } from '@/components/ui/Popover'
import { Button } from '@/components/ui/Button'
import { MenuListItem } from 'react95'

export function ExportMenu() {
  const [open, setOpen] = useState(false)
  const { downloadText, downloadCsv, downloadJson } = useBuildExport()

  const options = [
    { label: 'Text (.txt)',  action: downloadText },
    { label: 'CSV (.csv)',   action: downloadCsv },
    { label: 'JSON (.json)', action: downloadJson },
  ]

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
          Export ▾
        </Button>
      }
    >
      <>
        {options.map((opt) => (
          <MenuListItem key={opt.label} onClick={() => { opt.action(); setOpen(false) }}>
            {opt.label}
          </MenuListItem>
        ))}
      </>
    </Popover>
  )
}
