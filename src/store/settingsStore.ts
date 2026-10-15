import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SCHEME_ID } from '@/theme/windowsTheme'

export type DistanceUnit = 'mi' | 'km'

interface SettingsState {
  builderName: string
  setBuilderName: (name: string) => void
  /** Display unit for odometers and the service log. Stored values are always km. */
  distanceUnit: DistanceUnit
  setDistanceUnit: (unit: DistanceUnit) => void
  /** Windows color scheme id (see src/theme/schemes.ts). */
  colorScheme: string
  /** Windows 98 gradient title bars; off is the flat Windows 95 look. */
  titleGradients: boolean
  setAppearance: (appearance: { colorScheme: string; titleGradients: boolean }) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      builderName: '',
      setBuilderName: (builderName) => set({ builderName }),
      distanceUnit: 'mi',
      setDistanceUnit: (distanceUnit) => set({ distanceUnit }),
      colorScheme: DEFAULT_SCHEME_ID,
      titleGradients: false,
      setAppearance: ({ colorScheme, titleGradients }) => set({ colorScheme, titleGradients }),
    }),
    {
      name: 'ppp-settings',
    },
  ),
)
