import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'react95'
import styled from 'styled-components'
import { CompatIcon } from '@/components/ui/CompatIcon'
import { productPath } from '@/data/categoryConfig'
import { formatPrice } from '@/utils/format'
import type { SlotRow, CompatLevel } from './buildRows'
import { partTitle } from './buildRows'

/** react-router link styled like react95's Anchor (navy, underlined on hover). */
export const RouterAnchor = styled(Link)`
  color: var(--win-link);
  text-decoration: none;
  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 1px dotted currentColor; }
`

/** Tiny text-style button used for "change", "custom…", "edit". */
export const TextButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 11px;
  color: var(--win-link);
  cursor: pointer;
  text-decoration: underline;
  &:hover { color: var(--win-link); }
`

/** Severity icon for a row, titled with every issue message. Renders nothing when clean. */
export function RowCompatIcon({ row }: { row: SlotRow }) {
  if (!row.severity) return null
  return <CompatIcon severity={row.severity} title={row.issues.map((i) => i.message).join('\n')} />
}

const OkIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  background: #008000;
  border: 1px solid #000;
  flex-shrink: 0;
`

/** Whole-build status marker: green ✓ when clean, otherwise the worst CompatIcon. */
export function CompatLevelIcon({ level, title }: { level: CompatLevel; title?: string }) {
  if (level === 'error') return <CompatIcon severity="error" title={title} />
  if (level === 'warning') return <CompatIcon severity="warning" title={title} />
  if (level === 'ok') return <OkIcon role="img" aria-label={title ?? 'Compatible'} title={title ?? 'Compatible'}>✓</OkIcon>
  return null
}

/**
 * The "Selection" cell content: compat icon, "2 ×" prefix, part name linking to its
 * product page (custom parts aren't linked and get a "(custom)" marker).
 * `quantityControl` replaces the plain "2 ×" prefix (the builder's stepper).
 */
export function SelectionLabel({ row, quantityControl, children }: { row: SlotRow; quantityControl?: ReactNode; children?: ReactNode }) {
  const part = row.part
  if (!part) return null
  const title = partTitle(part)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
      <RowCompatIcon row={row} />
      {quantityControl ?? (row.quantity > 1 && <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{row.quantity} ×</span>)}
      {row.isCustom ? (
        <span style={{ fontWeight: 700 }}>
          {part.url ? (
            <a href={part.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{title}</a>
          ) : title}
          <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 6 }}>(custom)</span>
        </span>
      ) : (
        <RouterAnchor to={productPath(part.id)} style={{ fontWeight: 700 }}>{title}</RouterAnchor>
      )}
      {children}
    </span>
  )
}

/** Opens the best retailer offer in a new tab. Nothing for custom/unpriced parts. */
export function BuyButton({ row, fullWidth }: { row: SlotRow; fullWidth?: boolean }) {
  const url = row.offer?.url
  if (!url) return null
  return (
    <Button
      size="sm"
      fullWidth={fullWidth}
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      title={`Buy at ${row.offer!.merchant.name}`}
      aria-label={`Buy ${row.part ? partTitle(row.part) : ''} at ${row.offer!.merchant.name}`}
      style={{ fontSize: 11, height: 22, padding: '0 8px' }}
    >
      Buy
    </Button>
  )
}

/**
 * Quiet, secondary market info for a tracker row: today's best (simulated) price, where,
 * and a small "buy ↗" link. Used-market listings (discontinued parts) say so.
 */
export function MarketInfo({ row, inline }: { row: SlotRow; inline?: boolean }) {
  if (!row.part || row.price == null) return null
  const offer = row.offer
  const where = offer ? `${offer.merchant.name}${offer.merchant.used ? ' (used)' : ''}` : row.isCustom ? 'your price' : ''
  const buy = offer?.url && (
    <a
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Buy at ${offer.merchant.name}`}
      aria-label={`Buy ${partTitle(row.part)} at ${offer.merchant.name}`}
      style={{ color: 'var(--win-link)', fontSize: 11, whiteSpace: 'nowrap' }}
    >
      buy ↗
    </a>
  )
  if (inline) {
    return (
      <span style={{ fontSize: 11, color: 'var(--win-muted)' }}>
        Market {formatPrice(row.price)}{where && ` @ ${where}`} {buy}
      </span>
    )
  }
  return (
    <span style={{ display: 'flex', flexDirection: 'column', fontSize: 11, lineHeight: '13px', color: 'var(--win-muted)', minWidth: 0 }}>
      <span style={{ whiteSpace: 'nowrap' }}>{formatPrice(row.price)} {buy}</span>
      {where && <span style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={where}>{where}</span>}
    </span>
  )
}
