import { useToast } from './useToast'
import { useBuildStore } from '@/store/buildStore'

export function useBuildShare() {
  const { success } = useToast()
  const build = useBuildStore((s) => s.build)

  const getShareUrl = () => {
    if (build.id) {
      return `${window.location.origin}/build/${build.id}`
    }
    const encoded = btoa(encodeURIComponent(JSON.stringify(build)))
    return `${window.location.origin}/build/shared?b=${encoded}`
  }

  const copyShareLink = async () => {
    const url = getShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      success('Link copied!')
    } catch {
      // fallback
      const el = document.createElement('input')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      success('Link copied!')
    }
  }

  return { copyShareLink, getShareUrl }
}
