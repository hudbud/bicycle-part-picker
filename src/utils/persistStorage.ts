import type { StateStorage } from 'zustand/middleware'
import { useToastStore } from '@/store/toastStore'

// Wraps localStorage so a full quota (common once builds carry photos) surfaces
// as a toast instead of silently dropping the save.
export const quotaSafeStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  removeItem: (name) => localStorage.removeItem(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch (err) {
      console.error(`Failed to persist "${name}":`, err)
      useToastStore.getState().show('Storage full — try removing a photo or exporting a build', 'error')
    }
  },
}
