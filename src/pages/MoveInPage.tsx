import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Window, WindowHeader, WindowContent, Button } from 'react95'
import styled from 'styled-components'
import { importFromOldSite, isOldSite, type OldSiteData } from '@/utils/oldSiteImport'
import { useToastStore } from '@/store/toastStore'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 480px;
  margin: 0 auto;

  p { font-size: 13px; line-height: 1.6; margin: 0 0 14px; }
`

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

/** Opened by the old address's "moved" page, which sends over what it had saved. */
export function MoveInPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<'waiting' | 'failed'>(window.opener ? 'waiting' : 'failed')

  useEffect(() => {
    const opener = window.opener as Window | null
    if (!opener) return
    let done = false
    const onMessage = async (e: MessageEvent) => {
      if (done || e.source !== opener || !isOldSite(e.origin) || e.data?.type !== 'ppp-move-data') return
      done = true
      try {
        const { bikes, parts } = await importFromOldSite(e.data.data as OldSiteData)
        opener.postMessage({ type: 'ppp-move-done' }, e.origin)
        const what = bikes || parts ? `Moved ${plural(bikes, 'bike')} and ${plural(parts, 'part')} from the old address.` : 'Everything from the old address was already here.'
        useToastStore.getState().show(what, 'success')
        navigate('/garage', { replace: true })
      } catch {
        setState('failed')
      }
    }
    // The old page keeps sending until it hears back, so this only has to listen.
    window.addEventListener('message', onMessage)
    const timer = setTimeout(() => { if (!done) setState('failed') }, 10_000)
    return () => { window.removeEventListener('message', onMessage); clearTimeout(timer) }
  }, [navigate])

  return (
    <PageWindow>
      <WindowHeader active><span>Moving In</span></WindowHeader>
      <WindowContent>
        {state === 'waiting' ? (
          <p role="status">Bringing your bikes and parts over from the old address…</p>
        ) : (
          <>
            <p role="alert">
              Nothing came over from the old address. Go back to the tab with the old site and press{' '}
              <strong>Move them and continue</strong> again, or use <strong>Export all…</strong> there and{' '}
              <strong>Restore backup…</strong> here.
            </p>
            <Button primary onClick={() => navigate('/garage')}>Open Garage</Button>
          </>
        )}
      </WindowContent>
    </PageWindow>
  )
}
