import { useMemo, type ReactNode } from 'react'
import { ThemeProvider, createGlobalStyle } from 'styled-components'
import { styleReset } from 'react95'
import { useSettingsStore } from '@/store/settingsStore'
import { schemeById, windowsTheme } from './windowsTheme'

export const cssVars = (vars: Record<string, string>) => Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join('\n')

const GlobalStyle = createGlobalStyle<{ $vars: Record<string, string>; $dark: boolean }>`
  ${styleReset}
  :root {
    ${({ $vars }) => cssVars($vars)}
    color-scheme: ${({ $dark }) => ($dark ? 'dark' : 'light')};
  }
  body {
    font-family: 'ms_sans_serif', sans-serif;
    color: var(--win-text);
  }
`

/** Applies the chosen Windows color scheme to react95 components and the app's CSS variables. */
export function AppTheme({ children }: { children: ReactNode }) {
  const colorScheme = useSettingsStore((s) => s.colorScheme)
  const gradients = useSettingsStore((s) => s.titleGradients)
  const { theme, vars, dark } = useMemo(() => windowsTheme(schemeById(colorScheme), { gradients }), [colorScheme, gradients])

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle $vars={vars} $dark={dark} />
      {children}
    </ThemeProvider>
  )
}
