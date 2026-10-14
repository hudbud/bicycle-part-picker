import styled from 'styled-components'
import type { ComponentSlot } from '@/types/build'
import { isAcquired } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { ConditionBadge } from './ConditionBadge'

/** Unstyled button wrapper so a whole table cell's content opens the details dialog. */
export const CellButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-width: 0;
  &:hover .hint, &:focus-visible .hint { text-decoration: underline; color: var(--win-link); }
  &:focus-visible { outline: 1px dotted currentColor; }
`

const Hint = styled.span.attrs({ className: 'hint' })`
  font-size: 11px;
  color: var(--win-gray-text);
`

const Source = styled.span`
  font-size: 11px;
  color: var(--win-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`

/**
 * What you paid: bold amount, a grey "add" prompt for acquired parts without one,
 * or "—" for parts still to buy.
 */
export function PaidValue({ slot, onEdit }: { slot: ComponentSlot; onEdit?: () => void }) {
  if (!slot.part) return null
  const paid = slot.tracking?.pricePaid
  const content = paid != null
    ? <strong style={{ fontSize: 13 }}>{paid === 0 ? 'free' : formatPrice(paid)}</strong>
    : isAcquired(slot) ? <Hint>+ paid</Hint> : <Hint title="Still to buy">—</Hint>
  if (!onEdit) return content
  return <CellButton onClick={onEdit} title="Edit what you paid, source, condition…" aria-label="Edit price paid">{content}</CellButton>
}

/** Condition chip + source ("Used·good  eBay"), or a grey prompt for acquired parts. */
export function ConditionSource({ slot, onEdit }: { slot: ComponentSlot; onEdit?: () => void }) {
  if (!slot.part) return null
  const t = slot.tracking
  const has = t?.condition || t?.source
  const content = has ? (
    <>
      <ConditionBadge condition={t?.condition} short />
      {t?.source && <Source title={t.source}>{t.source}</Source>}
    </>
  ) : isAcquired(slot) ? <Hint>+ condition / source</Hint> : null
  if (!onEdit || !content) return content
  return <CellButton onClick={onEdit} title="Edit condition, source, serial…" aria-label="Edit condition and source">{content}</CellButton>
}
