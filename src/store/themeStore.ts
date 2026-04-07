import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggle: () => void
  setDark: (dark: boolean) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: typeof window !== 'undefined'
    ? localStorage.getItem('ppp-theme') !== 'light'
    : true,
  toggle: () =>
    set((state) => {
      const next = !state.isDark
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('ppp-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('ppp-theme', 'light')
      }
      return { isDark: next }
    }),
  setDark: (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('ppp-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('ppp-theme', 'light')
    }
    set({ isDark: dark })
  },
}))
