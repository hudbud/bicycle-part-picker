import { Popover } from '@/components/ui/Popover'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

interface DeleteConfirmProps {
  onConfirm: () => void
}

export function DeleteConfirm({ onConfirm }: DeleteConfirmProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(!open)}
          className="text-red-500 hover:text-red-400"
        >
          Delete
        </Button>
      }
      className="right-0"
    >
      <div className="p-3 space-y-2 w-56">
        <p className="text-sm font-medium text-text-primary">Delete this build?</p>
        <p className="text-xs text-text-muted">This can't be undone.</p>
        <div className="flex gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => { onConfirm(); setOpen(false) }}
            className="flex-1"
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Popover>
  )
}
