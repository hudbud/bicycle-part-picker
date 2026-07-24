import { useToast } from './useToast'
import { useBuildStore } from '@/store/buildStore'
import { encodeBuildForShare } from '@/utils/buildCodec'

export function useBuildShare() {
  const { success } = useToast()
  const build = useBuildStore((s) => s.build)

  // Build ids only exist in the sharer's own localStorage, so an /build/:id
  // link 404s for anyone else. The payload is encoded directly into the URL instead.
  const getShareUrl = () => `${window.location.origin}/build/shared?b=${encodeBuildForShare(build)}`

  const copyShareLink = async () => {
    const url = getShareUrl()
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('input')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    success(build.photo ? 'Link copied! (photo not included)' : 'Link copied!')
  }

  return { copyShareLink, getShareUrl }
}
