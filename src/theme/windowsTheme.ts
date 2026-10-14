import type { Theme } from 'react95/dist/types'
import { COLOR_SCHEMES, type ColorScheme } from './schemes'

export const DEFAULT_SCHEME_ID = 'windows-standard'

export const schemeById = (id: string | undefined): ColorScheme =>
  COLOR_SCHEMES.find((s) => s.id === id) ?? COLOR_SCHEMES.find((s) => s.id === DEFAULT_SCHEME_ID)!

// ---------- color math ----------

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

/** `a` blended toward `b` by `t` (0 = a, 1 = b). */
export const mix = (a: string, b: string, t: number) => {
  const [x, y] = [rgb(a), rgb(b)]
  return toHex(x.map((v, i) => v + (y[i] - v) * t))
}

const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const contrast = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

export const isDark = (hex: string) => luminance(hex) < 0.2

/** The first candidate readable on every background, else the most readable one. */
const readable = (candidates: string[], backgrounds: string[], min = 4.5) => {
  const score = (c: string) => Math.min(...backgrounds.map((bg) => contrast(c, bg)))
  return candidates.find((c) => score(c) >= min) ?? [...candidates].sort((a, b) => score(b) - score(a))[0]
}

// ---------- theme ----------

export interface ThemeOptions {
  /** Windows 98 title bars: active/inactive title fade into their gradient colors. */
  gradients: boolean
}

const titleFill = (from: string, to: string | undefined, gradients: boolean) =>
  gradients && to && to !== from ? `linear-gradient(to right, ${from}, ${to})` : from

/** A react95 theme, plus the CSS variables the app's own styles use, for a Windows color scheme. */
export function windowsTheme(scheme: ColorScheme, { gradients }: ThemeOptions) {
  const c = scheme.colors
  const dark = isDark(c.Window)
  const surfaces = [c.Window, c.ButtonFace]

  const link = readable(dark ? ['#ffff00', '#00ffff', c.Hilight] : [c.Hilight, '#000080', '#0000ff'], surfaces)
  const muted = readable([mix(c.ButtonText, c.ButtonFace, 0.3), mix(c.ButtonText, c.ButtonFace, 0.15), c.ButtonText], surfaces)
  const ok = readable(dark ? ['#00ff00', '#80ff80'] : ['#006400', '#004000'], surfaces)
  const bad = readable(dark ? ['#ff6060', '#ff9090'] : ['#a00000', '#800000'], surfaces)
  const warn = readable(dark ? ['#ffd400', '#ffff00'] : ['#806000', '#604800'], surfaces)

  const theme: Theme = {
    name: scheme.id,
    anchor: link,
    anchorVisited: link,
    borderDark: c.ButtonShadow,
    borderDarkest: c.ButtonDkShadow,
    borderLight: c.ButtonLight,
    borderLightest: c.ButtonHilight,
    canvas: c.Window,
    canvasText: c.WindowText,
    canvasTextDisabled: c.GrayText,
    canvasTextDisabledShadow: c.ButtonHilight,
    canvasTextInvert: c.HilightText,
    checkmark: c.WindowText,
    checkmarkDisabled: c.GrayText,
    desktopBackground: c.Background,
    flatDark: c.ButtonShadow,
    flatLight: c.ButtonLight,
    focusSecondary: '#fefe03',
    headerBackground: titleFill(c.ActiveTitle, c.GradientActiveTitle, gradients),
    headerNotActiveBackground: titleFill(c.InactiveTitle, c.GradientInactiveTitle, gradients),
    headerNotActiveText: c.InactiveTitleText,
    headerText: c.TitleText,
    hoverBackground: c.Hilight,
    material: c.ButtonFace,
    materialDark: mix(c.ButtonFace, c.ButtonShadow, 0.5),
    materialText: c.ButtonText,
    materialTextDisabled: c.GrayText,
    materialTextDisabledShadow: c.ButtonHilight,
    materialTextInvert: c.HilightText,
    progress: c.Hilight,
    tooltip: c.InfoWindow,
  }

  const vars: Record<string, string> = {
    '--win-face': c.ButtonFace,
    '--win-text': c.ButtonText,
    '--win-hilight': c.ButtonHilight,
    '--win-light': c.ButtonLight,
    '--win-shadow': c.ButtonShadow,
    '--win-dkshadow': c.ButtonDkShadow,
    '--win-window': c.Window,
    '--win-window-text': c.WindowText,
    '--win-gray-text': c.GrayText,
    '--win-muted': muted,
    '--win-stripe': mix(c.Window, c.ButtonFace, dark ? 0.5 : 0.3),
    '--win-select': c.Hilight,
    '--win-select-text': c.HilightText,
    '--win-select-soft': mix(c.Window, c.Hilight, dark ? 0.35 : 0.1),
    '--win-title': theme.headerBackground,
    '--win-title-solid': c.ActiveTitle,
    '--win-title-text': c.TitleText,
    '--win-title-inactive': theme.headerNotActiveBackground,
    '--win-title-inactive-text': c.InactiveTitleText,
    '--win-desktop': c.Background,
    '--win-info': c.InfoWindow,
    '--win-info-text': c.InfoText,
    '--win-link': link,
    '--win-ok': ok,
    '--win-bad': bad,
    '--win-warn': warn,
  }

  return { theme, vars, dark }
}
