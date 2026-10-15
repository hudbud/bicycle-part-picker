import styled from 'styled-components'
import { useAccountStore } from '@/account/accountStore'
import { STATUS_TEXT } from './AccountButton'

const Line = styled.span`
  font-size: 11px;
  color: var(--win-muted);
  text-align: right;
`

const LinkButton = styled.button`
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: var(--win-link);
  text-decoration: underline;
  cursor: pointer;
`

/** Where this person's bikes are kept: this browser, or their account. */
export function SaveLocation() {
  const { available, user, status, statusDetail, setSignInOpen } = useAccountStore()
  if (!available) return null
  if (!user) {
    return (
      <Line>
        Saved in this browser only. <LinkButton onClick={() => setSignInOpen(true)}>Sign in</LinkButton> to keep it on every device.
      </Line>
    )
  }
  return <Line role="status" title={statusDetail} data-sync={status}>{STATUS_TEXT[status] || 'Saved to your account'}</Line>
}
