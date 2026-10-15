import styled from 'styled-components'
import type { ComponentSlot } from '@/types/build'
import { useBuildStore } from '@/store/buildStore'
import { slotQuantity } from '@/data/pricing'

const Step = styled.button`
  width: 16px;
  height: 16px;
  padding: 0;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  background: var(--win-face);
  color: var(--win-text);
  border: 1px solid;
  border-color: var(--win-hilight) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilight);
  box-shadow: inset -1px -1px 0 var(--win-shadow);
  cursor: pointer;
  &:active:not(:disabled) { border-color: var(--win-dkshadow) var(--win-hilight) var(--win-hilight) var(--win-dkshadow); box-shadow: inset 1px 1px 0 var(--win-shadow); }
  &:disabled { color: var(--win-gray-text); cursor: default; }
`

/** "[−] 2 × [+]" quantity control for tires, rotors, rims… */
export function QtyStepper({ slot, label }: { slot: ComponentSlot; label: string }) {
  const setQuantity = useBuildStore((s) => s.setQuantity)
  const qty = slotQuantity(slot)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
      <Step type="button" disabled={qty <= 1} onClick={() => setQuantity(slot.category, qty - 1)} aria-label={`Fewer ${label}`}>−</Step>
      <span style={{ fontSize: 12, minWidth: 22, textAlign: 'center' }} aria-label={`Quantity ${qty}`}>{qty} ×</span>
      <Step type="button" disabled={qty >= 99} onClick={() => setQuantity(slot.category, qty + 1)} aria-label={`More ${label}`}>+</Step>
    </span>
  )
}
