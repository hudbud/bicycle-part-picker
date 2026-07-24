import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  builderName: string
  setBuilderName: (name: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      builderName: '',
      setBuilderName: (builderName) => set({ builderName }),
    }),
    {
      name: 'ppp-settings',
    },
  ),
)
