import { useEffect, useState } from 'react'
import styled from 'styled-components'
import type { BikePhoto } from '@/types/build'
import { PhotoImg } from './PhotoImg'

const Stage = styled.div`
  position: relative;
  background: #000;
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
`

const Main = styled(PhotoImg)`
  display: block;
  width: 100%;
  max-height: 560px;
  object-fit: contain;

  @media (max-width: 639px) {
    max-height: 360px;
  }
`

const Missing = styled.div`
  display: grid;
  place-items: center;
  height: 160px;
  color: #c0c0c0;
  font-size: 12px;
`

const Step = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 40px;
  border: 2px solid;
  border-color: var(--win-hilight) var(--win-shadow) var(--win-shadow) var(--win-hilight);
  background: var(--win-face);
  color: var(--win-text);
  font: 700 14px 'ms_sans_serif', sans-serif;
  cursor: pointer;
  opacity: 0.85;

  &:hover { opacity: 1; }
  &.prev { left: 6px; }
  &.next { right: 6px; }
`

const Caption = styled.p`
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--win-muted);
  overflow-wrap: anywhere;
`

const Strip = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
`

const Thumb = styled.button`
  flex: 0 0 auto;
  padding: 0;
  width: 64px;
  height: 48px;
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  background: #000;
  cursor: pointer;

  &[aria-current='true'] { outline: 2px solid var(--win-select); outline-offset: 1px; }
  & img { width: 100%; height: 100%; object-fit: cover; display: block; }
`

interface PhotoGalleryProps {
  photos: BikePhoto[]
  alt: string
  initialIndex?: number
  /** Link the big photo to its full-size original (public links only). */
  linkOriginal?: boolean
}

/** Big photo + caption + thumbnail strip. Arrow keys step through when it has focus. */
export function PhotoGallery({ photos, alt, initialIndex = 0, linkOriginal }: PhotoGalleryProps) {
  const [index, setIndex] = useState(initialIndex)
  useEffect(() => { if (index >= photos.length) setIndex(Math.max(0, photos.length - 1)) }, [photos.length, index])
  if (!photos.length) return null

  const photo = photos[Math.min(index, photos.length - 1)]
  const step = (d: number) => setIndex((i) => (i + d + photos.length) % photos.length)
  const main = <Main photo={photo} alt={photo.caption || alt} fallback={<Missing>Photo unavailable</Missing>} />

  return (
    <div
      tabIndex={photos.length > 1 ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') step(-1)
        if (e.key === 'ArrowRight') step(1)
      }}
      style={{ outline: 'none' }}
    >
      <Stage>
        {linkOriginal && photo.url
          ? <a href={photo.url} target="_blank" rel="noopener noreferrer" title="Open full-size photo">{main}</a>
          : main}
        {photos.length > 1 && (
          <>
            <Step className="prev" aria-label="Previous photo" onClick={() => step(-1)}>‹</Step>
            <Step className="next" aria-label="Next photo" onClick={() => step(1)}>›</Step>
          </>
        )}
      </Stage>
      {(photo.caption || photos.length > 1) && (
        <Caption>
          {photos.length > 1 && <span style={{ color: 'var(--win-muted)' }}>{index + 1} / {photos.length}{photo.caption ? ' — ' : ''}</span>}
          {photo.caption}
        </Caption>
      )}
      {photos.length > 1 && (
        <Strip>
          {photos.map((p, i) => (
            <Thumb key={p.id} aria-label={`Photo ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)}>
              <PhotoImg photo={p} alt="" loading="lazy" />
            </Thumb>
          ))}
        </Strip>
      )}
    </div>
  )
}
