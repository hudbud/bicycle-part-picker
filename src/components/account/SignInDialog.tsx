import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldInput } from '@/components/tracking/fields'
import { useAccountStore } from '@/account/accountStore'
import { finishEmailSignIn, requestEmailSignIn, signInWithGoogle, signInForTesting } from '@/account/cloudSync'
import { useToastStore } from '@/store/toastStore'

const GIS_SRC = 'https://accounts.google.com/gsi/client'

let gisLoad: Promise<void> | undefined
let gisClientId: string | undefined

function loadGis(): Promise<void> {
  gisLoad ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => { gisLoad = undefined; s.remove(); reject(new Error('Google sign-in did not load')) }
    document.head.appendChild(s)
  })
  return gisLoad
}

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;

  p { margin: 0; line-height: 1.4; }
  .fine { font-size: 11px; color: var(--win-muted); }
`

// Google's button is an iframe of fixed height; reserve the space so the dialog doesn't jump.
const ButtonSlot = styled.div`
  min-height: 44px;
  display: flex;
  align-items: center;
  &[hidden] { display: none; }
`

const EmailForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label { font-size: 12px; }
  .row { display: flex; gap: 6px; }
  .row input { flex: 1; min-width: 0; }
  .links { display: flex; gap: 12px; font-size: 11px; }
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

const TestRow = styled.form`
  display: flex;
  gap: 6px;
  align-items: center;
  border-top: 1px solid var(--win-shadow);
  padding-top: 10px;
  font-size: 11px;
`

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err))

/** Email me a link, then (on this screen) type the code from it. */
function EmailSignIn() {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string>()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string>()
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (sentTo) codeRef.current?.focus() }, [sentTo])

  const send = async (to: string) => {
    setBusy(true)
    setProblem(undefined)
    try {
      await requestEmailSignIn(to)
      setSentTo(to)
      setCode('')
    } catch (err) {
      setProblem(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async () => {
    if (!sentTo) return
    setBusy(true)
    setProblem(undefined)
    try {
      await finishEmailSignIn({ email: sentTo, code })
      setSentTo(undefined)
      setEmail('')
    } catch (err) {
      setProblem(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const problemLine = problem && <p role="alert" style={{ color: 'var(--win-bad)', fontSize: 12 }}>{problem}</p>

  if (!sentTo) {
    return (
      <EmailForm onSubmit={(e) => { e.preventDefault(); void send(email.trim()) }}>
        <label htmlFor="sign-in-email">Or get a sign-in link by email:</label>
        <div className="row">
          <FieldInput id="sign-in-email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button size="sm" type="submit" disabled={busy}>Email me a link</Button>
        </div>
        {problemLine}
      </EmailForm>
    )
  }

  return (
    <EmailForm onSubmit={(e) => { e.preventDefault(); void submitCode() }}>
      <p role="status">
        We sent a link to <strong>{sentTo}</strong>. Open it on this device, or type the 6-digit code from the email:
      </p>
      <div className="row">
        <FieldInput
          ref={codeRef}
          aria-label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ letterSpacing: 2 }}
        />
        <Button size="sm" type="submit" disabled={busy}>Sign in</Button>
      </div>
      {problemLine}
      <div className="links">
        <LinkButton type="button" disabled={busy} onClick={() => void send(sentTo)}>Send again</LinkButton>
        <LinkButton type="button" onClick={() => { setSentTo(undefined); setProblem(undefined) }}>Use a different email</LinkButton>
      </div>
      <p className="fine">Not there? Check your spam folder. Links and codes work for 15 minutes.</p>
    </EmailForm>
  )
}

function failed(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err)
  useToastStore.getState().show(`Sign-in didn't work (${msg}). Try again in a moment.`, 'error')
}

export function SignInDialog() {
  const open = useAccountStore((s) => s.signInOpen)
  const setOpen = useAccountStore((s) => s.setSignInOpen)
  const clientId = useAccountStore((s) => s.googleClientId)
  const devLogin = useAccountStore((s) => s.devLogin)
  const emailSignIn = useAccountStore((s) => s.emailSignIn)
  const slot = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState(false)
  const [testEmail, setTestEmail] = useState('rider@example.com')

  useEffect(() => {
    if (!open || !clientId) return
    let cancelled = false
    setLoadError(false)
    loadGis()
      .then(() => {
        const id = window.google?.accounts.id
        if (cancelled || !id || !slot.current) return
        if (gisClientId !== clientId) {
          id.initialize({ client_id: clientId, callback: ({ credential }) => void signInWithGoogle(credential).catch(failed), use_fedcm_for_button: true })
          gisClientId = clientId
        }
        id.renderButton(slot.current, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'rectangular', width: 260 })
      })
      .catch(() => { if (!cancelled) setLoadError(true) })
    return () => { cancelled = true }
  }, [open, clientId])

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Sign In" style={{ maxWidth: 400 }}>
      <Body>
        <p>Sign in to keep your garage, parts bin and builds on every device you use.</p>
        {/* Google renders its button into this div, so React leaves its contents alone. */}
        <ButtonSlot ref={slot} hidden={loadError} />
        {loadError && (
          <p style={{ color: 'var(--win-bad)' }}>
            Couldn't load Google sign-in. Check your connection, or allow accounts.google.com if an ad blocker is on.
          </p>
        )}
        {emailSignIn && <EmailSignIn />}
        <p className="fine">
          No account needed to use the site: without one, everything stays in this browser.
          Signing in saves your name, email, photos and what you track here.{' '}
          <Link to="/about#accounts" onClick={() => setOpen(false)} style={{ color: 'var(--win-link)' }}>More about accounts</Link>
        </p>
        {devLogin && (
          <TestRow onSubmit={(e) => { e.preventDefault(); void signInForTesting(testEmail, testEmail.split('@')[0]).catch(failed) }}>
            <span>Test sign-in (local only):</span>
            <FieldInput value={testEmail} onChange={(e) => setTestEmail(e.target.value)} aria-label="Test account email" style={{ flex: 1 }} />
            <Button size="sm" type="submit">Sign in</Button>
          </TestRow>
        )}
      </Body>
    </Modal>
  )
}
