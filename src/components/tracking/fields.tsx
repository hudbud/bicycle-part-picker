import styled, { css } from 'styled-components'

/**
 * Compact Win95 sunken form controls (react95's TextInput is 36px tall — too big for
 * dense tracker tables and dialogs). Same bevel as react95 fields.
 */
const sunken = css`
  font-family: inherit;
  font-size: 12px;
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  box-shadow: inset 1px 1px 0 var(--win-dkshadow);
  background: var(--win-window);
  color: var(--win-window-text);
  border-radius: 0;
  box-sizing: border-box;
  min-width: 0;
  &:focus { outline: 1px dotted var(--win-window-text); outline-offset: -4px; }
  &:disabled { background: var(--win-face); color: var(--win-gray-text); }
`

export const FieldInput = styled.input`
  ${sunken}
  height: 24px;
  padding: 1px 4px;
  &[type='number'] { text-align: right; }
`

export const FieldSelect = styled.select`
  ${sunken}
  height: 24px;
  padding: 0 2px;
`

export const FieldTextarea = styled.textarea`
  ${sunken}
  padding: 3px 4px;
  resize: vertical;
  min-height: 44px;
`

export const FieldLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  font-weight: 700;
  min-width: 0;

  & > span.hint { font-weight: 400; color: var(--win-muted); }
`

/** "12.5" → 12.5, "" / junk → undefined. */
export function parseNum(s: string): number | undefined {
  if (s.trim() === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

/** Today as YYYY-MM-DD (local). */
export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
