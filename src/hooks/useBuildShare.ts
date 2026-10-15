import { useEffect, useState } from 'react'
import { useToast } from './useToast'
import { bikeShareUrl, type ShareOptions } from '@/utils/buildCodec'
import type { Build } from '@/types/build'

/**
 * Public `/bike#…` link for a build. Encoding is async (deflate), so this is '' until the
 * first link is ready, then keeps the previous link while a new one encodes.
 * Build ids only exist in the sharer's own localStorage, so the whole bike rides in the
 * URL fragment instead (catalog parts by id — see utils/buildCodec). Old
 * `/build/shared?b=` links still open on SharedBuildPage.
 */
export function useBikeLink(build: Build, opts: ShareOptions): string {
  const [url, setUrl] = useState('')
  const { notes, pricesPaid, condition, odometer } = opts
  useEffect(() => {
    let live = true
    bikeShareUrl(build, { notes, pricesPaid, condition, odometer }).then((u) => { if (live) setUrl(u) })
    return () => { live = false }
  }, [build, notes, pricesPaid, condition, odometer])
  return url
}

/**
 * Copy text with a toast. If the browser blocks the clipboard, selects `fallback`
 * (the visible field) so Ctrl+C still works.
 */
export function useCopyText() {
  const { success, error } = useToast()
  return async (text: string, message: string, fallback?: HTMLInputElement | HTMLTextAreaElement | null) => {
    try {
      await navigator.clipboard.writeText(text)
      success(message)
    } catch {
      fallback?.focus()
      fallback?.select()
      error('Copy blocked — text selected, press Ctrl+C')
    }
  }
}
