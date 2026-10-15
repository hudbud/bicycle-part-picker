import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Window, WindowHeader, WindowContent, Button } from 'react95'
import styled from 'styled-components'
import { useAccountStore } from '@/account/accountStore'
import { finishEmailSignIn } from '@/account/cloudSync'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 480px;
  margin: 0 auto;

  p { font-size: 13px; line-height: 1.6; margin: 0 0 14px; overflow-wrap: anywhere; }
`

function readLink() {
  const params = new URLSearchParams(window.location.hash.slice(1))
  return { token: params.get('token') ?? '', email: params.get('email') ?? '' }
}

/**
 * Where an emailed sign-in link lands. Signing in waits for a click: some mail systems open
 * every link to scan it, and that shouldn't use the link up.
 */
export function SignInLinkPage() {
  const navigate = useNavigate()
  const [{ token, email }] = useState(readLink)
  const user = useAccountStore((s) => s.user)
  const setSignInOpen = useAccountStore((s) => s.setSignInOpen)
  const [state, setState] = useState<'ready' | 'working' | 'failed'>(token ? 'ready' : 'failed')
  const [problem, setProblem] = useState<string>()

  // Take the token out of the address bar so it isn't left in history.
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [])

  const signIn = async () => {
    setState('working')
    try {
      await finishEmailSignIn({ token })
      navigate('/garage', { replace: true })
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err))
      setState('failed')
    }
  }

  const sameUser = !!user && !!email && user.email.toLowerCase() === email.toLowerCase()

  return (
    <PageWindow>
      <WindowHeader active><span>Sign In</span></WindowHeader>
      <WindowContent>
        {sameUser ? (
          <>
            <p>You&rsquo;re signed in as <strong>{user.email}</strong>.</p>
            <Button primary onClick={() => navigate('/garage')}>Open Garage</Button>
          </>
        ) : state === 'failed' ? (
          <>
            <p role="alert">
              {problem ?? 'This sign-in link is incomplete.'} Links work once, for 15 minutes. You can ask for a new one.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button primary onClick={() => setSignInOpen(true)}>Send a new link</Button>
              <Button onClick={() => navigate('/garage')}>Open Garage</Button>
            </div>
          </>
        ) : (
          <>
            <p>
              Finish signing in{email && <> as <strong>{email}</strong></>}?
              {user && <> This switches this browser from {user.email || user.name}.</>}
            </p>
            <Button primary disabled={state === 'working'} onClick={() => void signIn()}>
              {state === 'working' ? 'Signing in…' : 'Sign in'}
            </Button>
          </>
        )}
      </WindowContent>
    </PageWindow>
  )
}
