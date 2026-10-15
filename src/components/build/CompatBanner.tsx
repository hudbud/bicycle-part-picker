import { useMemo } from 'react'
import type { Build } from '@/types/build'
import { computeCompat, type BuildCompat } from '@/hooks/useCompat'
import styled from 'styled-components'
import { compatLevel, COMPAT_MESSAGES, weightLabel, weightTooltip, type CompatLevel } from './buildRows'

const LEVEL_STYLE: Record<CompatLevel, { bg: string; color: string; weightBg: string }> = {
  empty:   { bg: 'var(--win-stripe)', color: 'var(--win-window-text)', weightBg: 'var(--win-face)' },
  ok:      { bg: '#008000', color: '#fff', weightBg: '#006000' },
  warning: { bg: '#ffd400', color: '#000', weightBg: '#e0b800' },
  error:   { bg: '#c00000', color: '#fff', weightBg: '#900000' },
}

const Bar = styled.div<{ $level: CompatLevel }>`
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 30px;
  font-size: 13px;
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  box-shadow: inset 1px 1px 0 var(--win-dkshadow);
  background: ${({ $level }) => LEVEL_STYLE[$level].bg};
  color: ${({ $level }) => LEVEL_STYLE[$level].color};

  @media (max-width: 639px) {
    flex-direction: column;
    font-size: 12px;
  }
`

const Message = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-weight: 700;
  min-width: 0;
`

const Weight = styled.div<{ $level: CompatLevel }>`
  display: flex;
  align-items: center;
  padding: 5px 10px;
  white-space: nowrap;
  background: ${({ $level }) => LEVEL_STYLE[$level].weightBg};
  border-left: 1px solid rgba(0, 0, 0, 0.35);
  cursor: default;

  @media (max-width: 639px) {
    border-left: none;
    border-top: 1px solid rgba(0, 0, 0, 0.35);
    padding: 3px 10px;
  }
`

interface CompatBannerProps {
  build: Build
  /** Pass a precomputed result to avoid re-running the checker. */
  compat?: BuildCompat
}

/**
 * PCPartPicker-style compatibility bar: green / yellow / red (grey when empty),
 * with the build's estimated weight on the right ("+" when some weights are unknown).
 */
export function CompatBanner({ build, compat: given }: CompatBannerProps) {
  const compat = useMemo(() => given ?? computeCompat(build), [given, build])
  const level = compatLevel(build, compat)
  const tip = weightTooltip(compat)
  return (
    <Bar $level={level} role="status" aria-live="polite">
      <Message>{COMPAT_MESSAGES[level]}</Message>
      <Weight $level={level} title={tip}>
        Estimated Weight:&nbsp;<strong>{weightLabel(compat)}</strong>
      </Weight>
    </Bar>
  )
}
