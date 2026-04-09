import { Frame, Button } from 'react95'
import styled from 'styled-components'
import type { Toast as ToastType } from '@/store/toastStore'
import { useToastStore } from '@/store/toastStore'

const Container = styled.div`
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: none;
`

const ToastFrame = styled(Frame).attrs({ variant: 'window' })`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  pointer-events: auto;
  min-width: 220px;
  max-width: 320px;
`

const typeColors: Record<ToastType['type'], string> = {
  success: '#22c55e',
  error:   '#c0392b',
  info:    '#000000',
}

const icons: Record<ToastType['type'], string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
}

function ToastItem({ toast }: { toast: ToastType }) {
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <ToastFrame>
      <span style={{ color: typeColors[toast.type], fontWeight: 700, flexShrink: 0 }}>
        {icons[toast.type]}
      </span>
      <span style={{ flex: 1, fontSize: 12 }}>{toast.message}</span>
      <Button
        onClick={() => dismiss(toast.id)}
        style={{ padding: '0 6px', minWidth: 0, flexShrink: 0 }}
        aria-label="Dismiss"
      >
        ✕
      </Button>
    </ToastFrame>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <Container>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </Container>
  )
}
