import { Link } from 'react-router-dom'
import { AppBar, Toolbar } from 'react95'
import styled from 'styled-components'

const FooterLink = styled(Link)`
  font-size: 11px;
  color: inherit;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`

const ExternalLink = styled.a`
  font-size: 11px;
  color: inherit;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`

export function Footer() {
  return (
    <AppBar position="static" style={{ marginTop: 'auto' }}>
      <Toolbar style={{ gap: 16, fontSize: 11, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>Pedal Parts Picker</span>
          <FooterLink to="/build">Builder</FooterLink>
          <FooterLink to="/garage">Garage</FooterLink>
          <FooterLink to="/about">About</FooterLink>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ExternalLink
            href="mailto:hudson@hudbud.net?subject=Pedal Parts Picker Feedback"
            style={{ opacity: 0.8 }}
          >
            Send feedback
          </ExternalLink>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ opacity: 0.7 }}>
            Made by{' '}
            <ExternalLink href="https://hudbud.net" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700 }}>
              Hudson Paine
            </ExternalLink>
          </span>
        </div>
      </Toolbar>
    </AppBar>
  )
}
