import { useToastStore } from '@/store/toastStore'
import type { ToastType, ToastAction } from '@/store/toastStore'

export function useToast() {
  const show = useToastStore((s) => s.show)
  return {
    toast: (message: string, type?: ToastType) => show(message, type),
    success: (message: string, action?: ToastAction) => show(message, 'success', action),
    error: (message: string) => show(message, 'error'),
    info: (message: string) => show(message, 'info'),
  }
}
