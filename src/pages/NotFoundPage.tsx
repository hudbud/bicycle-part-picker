import { useNavigate } from 'react-router-dom'
import { Window, WindowHeader, WindowContent, Button } from 'react95'
import styled from 'styled-components'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
`

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <PageWindow>
      <WindowHeader active><span>404 — Page Not Found</span></WindowHeader>
      <WindowContent>
        <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
          That page doesn&rsquo;t exist. It may have moved, or the link is mistyped.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button primary onClick={() => navigate('/build')}>Builder</Button>
          <Button onClick={() => navigate('/products')}>Browse Parts</Button>
          <Button onClick={() => navigate('/')}>Home</Button>
        </div>
      </WindowContent>
    </PageWindow>
  )
}
