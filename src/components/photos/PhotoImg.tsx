import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react'
import type { BikePhoto } from '@/types/build'
import { photoObjectUrl } from '@/utils/photoStore'

/** The displayable src for a photo: its link, or an object URL for an upload on this device. */
export function usePhotoSrc(photo: BikePhoto | undefined): string | undefined {
  const [local, setLocal] = useState<{ key: string; src?: string }>()
  const key = photo?.url ? undefined : photo?.localKey

  useEffect(() => {
    if (!key) return
    let live = true
    photoObjectUrl(key).then((src) => { if (live) setLocal({ key, src }) })
    return () => { live = false }
  }, [key])

  if (photo?.url) return photo.url
  return key && local?.key === key ? local.src : undefined
}

interface PhotoImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  photo: BikePhoto | undefined
  /** Shown when the photo is missing (deleted upload, dead link). */
  fallback?: ReactNode
}

export function PhotoImg({ photo, fallback = null, onError, ...img }: PhotoImgProps) {
  const src = usePhotoSrc(photo)
  const [failed, setFailed] = useState<string>()
  if (!src || failed === src) return <>{fallback}</>
  return <img {...img} src={src} onError={(e) => { setFailed(src); onError?.(e) }} />
}
