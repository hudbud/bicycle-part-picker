import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Window, WindowHeader, WindowContent, GroupBox } from 'react95'
import type { Part } from '@/types/parts'
import type { CompatIssue } from '@/compat/engine'
import { worstSeverity } from '@/compat/engine'
import { productPath } from '@/data/categoryConfig'
import { getPartPrice } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { CompatIcon } from '@/components/ui/CompatIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { strikeMsrp } from './productUtils'

export const PageWindow = styled(Window)`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;

  /* Long product names would wrap out of the fixed-height title bar. */
  > div:first-child > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

export const TextLink = styled(Link)`
  color: var(--win-link);
  text-decoration: underline;
  &:hover {
    color: var(--win-link);
  }
`

/** The global react95 reset zeroes strong/b weight, so bold text needs an explicit weight. */
export const Strong = styled.strong`
  font-weight: 700;
`

/** GroupBox with the compact legend used across product pages. */
export const Box = styled(GroupBox)`
  padding: 12px 8px 8px;
  & > legend {
    font-size: 12px;
    font-weight: 700;
  }
`

export const Muted = styled.span`
  font-size: 11px;
  color: var(--win-muted);
`

export const Crumbs = styled.nav`
  font-size: 12px;
  margin-bottom: 8px;
  a {
    color: var(--win-link);
  }
  span.sep {
    margin: 0 6px;
    color: var(--win-gray-text);
  }
`

/** Brand in bold + model, linking to the product page. */
export function PartNameLink({ part, onClick }: { part: Part; onClick?: () => void }) {
  if (part.isCustom) {
    return (
      <span>
        <Strong>{part.brand}</Strong> {part.name} <Muted>(custom)</Muted>
      </span>
    )
  }
  return (
    <TextLink to={productPath(part.id)} onClick={onClick}>
      <Strong>{part.brand}</Strong> {part.name}
    </TextLink>
  )
}

/** Best price, with MSRP struck through when meaningfully higher. Discontinued parts show a used-market price. */
export function PriceCell({ part, align = 'right' }: { part: Part; align?: 'left' | 'right' }) {
  const msrp = strikeMsrp(part)
  const price = getPartPrice(part)
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {msrp != null && <s style={{ fontSize: 10, color: 'var(--win-gray-text)' }}>{formatPrice(msrp)}</s>}
      <Strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(price)}</Strong>
      {part.discontinued && price != null && (
        <span style={{ fontSize: 10, color: 'var(--win-muted)' }} title="Typical used-market price (simulated)">used</span>
      )}
    </span>
  )
}

const Tag = styled.span<{ $tone: 'grey' | 'teal' }>`
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  padding: 0 4px;
  white-space: nowrap;
  border: 1px solid ${({ $tone }) => ($tone === 'teal' ? '#008080' : '#808080')};
  color: ${({ $tone }) => ($tone === 'teal' ? '#006060' : '#404040')};
  background: #fff;
  vertical-align: middle;
`

/** "Discontinued" marker for vintage / NOS parts (used-market only). */
export function EraTag({ part, long }: { part: Part; long?: boolean }) {
  if (!part.discontinued) return null
  return (
    <Tag $tone="grey" title="No longer made — find it used or NOS. Prices are used-market estimates.">
      {long ? 'Discontinued — used market' : 'Discontinued'}
    </Tag>
  )
}

/** "You have this" marker: in the parts bin or on one of your bikes. */
export function HaveTag({ label = 'Have' }: { label?: string }) {
  return (
    <Tag $tone="teal" title="In your parts bin or on one of your bikes">
      ✓ {label}
    </Tag>
  )
}

/** Worst-severity icon whose tooltip lists every issue. */
export function IssuesIcon({ issues }: { issues: CompatIssue[] }) {
  const sev = worstSeverity(issues)
  if (!sev) return null
  return <CompatIcon severity={sev} title={issues.map((i) => i.message).join('\n')} />
}

export function NotFoundWindow({ title, heading, subtext, action }: { title: string; heading: string; subtext?: string; action?: ReactNode }) {
  return (
    <PageWindow style={{ maxWidth: 640 }}>
      <WindowHeader active>
        <span>{title}</span>
      </WindowHeader>
      <WindowContent>
        <EmptyState heading={heading} subtext={subtext} />
        {action && <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13 }}>{action}</div>}
      </WindowContent>
    </PageWindow>
  )
}
