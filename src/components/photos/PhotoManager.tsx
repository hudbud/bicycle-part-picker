import { useEffect, useRef, useState } from 'react'
import { Button, TextInput } from 'react95'
import styled from 'styled-components'
import type { BikePhoto } from '@/types/build'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/ui/Modal'
import { MAX_PHOTOS, isHostedPhoto, linkPhoto, normalizePhotoUrl, uploadPhotos } from '@/utils/bikePhotos'
import { useAccountStore } from '@/account/accountStore'
import { PhotoImg } from './PhotoImg'
import { PhotoGallery } from './PhotoGallery'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 8px;

  @media (max-width: 639px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Tile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`

const ThumbButton = styled.button`
  position: relative;
  padding: 0;
  height: 120px;
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  background: #000;
  cursor: zoom-in;

  & img { width: 100%; height: 100%; object-fit: cover; display: block; }

  @media (max-width: 639px) {
    height: 96px;
  }
`

const Tag = styled.span`
  position: absolute;
  left: 3px;
  top: 3px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 15px;
  background: var(--win-face);
  border: 1px solid var(--win-dkshadow);
  color: var(--win-text);

  &.cover { background: var(--win-select); color: var(--win-select-text); border-color: var(--win-select-text); }
  &.right { left: auto; right: 3px; }
`

const Missing = styled.span`
  display: grid;
  place-items: center;
  height: 100%;
  color: #c0c0c0;
  font-size: 11px;
`

const TileActions = styled.div`
  display: flex;
  gap: 2px;

  & button { min-width: 0; padding: 0 6px; height: 22px; font-size: 11px; }
  & .grow { flex: 1; }
`

const DropZone = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-height: 120px;
  padding: 8px;
  border: 2px dashed var(--win-shadow);
  font-size: 12px;
  text-align: center;

  &.over { border-color: var(--win-select); background: var(--win-select-soft); color: var(--win-window-text); }
  &.wide { grid-column: 1 / -1; min-height: 0; flex-direction: row; flex-wrap: wrap; align-items: center; text-align: left; }
`

const Hint = styled.p`
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--win-muted);
`

const imageFiles = (list: FileList | DataTransferItemList | null | undefined): File[] => {
  if (!list) return []
  const files = list instanceof FileList ? Array.from(list) : Array.from(list).map((i) => (i.kind === 'file' ? i.getAsFile() : null))
  return files.filter((f): f is File => !!f && f.type.startsWith('image/'))
}

const typingIn = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

interface PhotoManagerProps {
  photos: BikePhoto[]
  /** Functional update, so uploads that finish later don't clobber other edits. */
  update: (fn: (photos: BikePhoto[]) => BikePhoto[]) => void
  alt: string
}

/**
 * Add, caption, reorder and remove a bike's photos. Accepts the file picker, drag-and-drop
 * anywhere on the page, pasted images, and pasted image links.
 */
export function PhotoManager({ photos, update, alt }: PhotoManagerProps) {
  const { success, error } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [link, setLink] = useState('')
  const [viewing, setViewing] = useState<number>()
  const room = MAX_PHOTOS - photos.length
  const accounts = useAccountStore((s) => s.available)
  const signedIn = useAccountStore((s) => !!s.user)
  const setSignInOpen = useAccountStore((s) => s.setSignInOpen)
  const where = (p: BikePhoto) =>
    isHostedPhoto(p) ? { tag: 'Saved', title: 'Saved to your account: shows on all your devices and your shared bike page' }
      : p.url ? { tag: 'Link', title: 'Public link: shows on your shared bike page' }
        : signedIn ? { tag: 'Device', title: 'On this device, uploading to your account' }
          : { tag: 'Device', title: accounts ? 'Uploaded: stays on this device until you sign in' : 'Uploaded: stays on this device' }

  const addFiles = async (files: File[]) => {
    if (!files.length) return
    if (room <= 0) { error(`A bike can have up to ${MAX_PHOTOS} photos`); return }
    setBusy(true)
    const { photos: added, failed } = await uploadPhotos(files.slice(0, room))
    setBusy(false)
    if (added.length) {
      update((ps) => [...ps, ...added].slice(0, MAX_PHOTOS))
      success(added.length === 1 ? 'Photo added' : `${added.length} photos added`)
    }
    if (failed) error(`Couldn't read ${failed} file${failed === 1 ? '' : 's'} — try a JPEG or PNG`)
  }

  const addLink = (raw: string): boolean => {
    const url = normalizePhotoUrl(raw)
    if (!url) { error('Paste an https:// image link (Imgur, Reddit…)'); return false }
    if (photos.some((p) => p.url === url)) { error('That photo is already here'); return false }
    if (room <= 0) { error(`A bike can have up to ${MAX_PHOTOS} photos`); return false }
    update((ps) => [...ps, linkPhoto(url)])
    success('Photo link added')
    return true
  }

  // Page-wide drop and paste. Latest handlers via ref so the listeners stay put.
  const handlers = useRef({ addFiles, addLink })
  handlers.current = { addFiles, addLink }
  useEffect(() => {
    let depth = 0
    const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files')
    const enter = (e: DragEvent) => { if (hasFiles(e)) { depth++; setOver(true) } }
    const leave = (e: DragEvent) => { if (hasFiles(e) && --depth <= 0) { depth = 0; setOver(false) } }
    const dragover = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault() }
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth = 0
      setOver(false)
      void handlers.current.addFiles(imageFiles(e.dataTransfer?.files))
    }
    const paste = (e: ClipboardEvent) => {
      const files = imageFiles(e.clipboardData?.items)
      if (files.length) { e.preventDefault(); void handlers.current.addFiles(files); return }
      const text = e.clipboardData?.getData('text/plain').trim() ?? ''
      if (!typingIn(e.target) && /^https:\/\/\S+$/.test(text)) { e.preventDefault(); handlers.current.addLink(text) }
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', dragover)
    window.addEventListener('drop', drop)
    window.addEventListener('paste', paste)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', dragover)
      window.removeEventListener('drop', drop)
      window.removeEventListener('paste', paste)
    }
  }, [])

  const move = (from: number, to: number) =>
    update((ps) => {
      if (to < 0 || to >= ps.length) return ps
      const next = [...ps]
      next.splice(to, 0, ...next.splice(from, 1))
      return next
    })
  const setCaption = (id: string, caption: string) =>
    update((ps) => ps.map((p) => (p.id !== id ? p : caption ? { ...p, caption } : (({ caption: _c, ...rest }) => rest)(p))))
  const remove = (id: string) => update((ps) => ps.filter((p) => p.id !== id))

  const zone = (
    <DropZone className={[over ? 'over' : '', photos.length ? '' : 'wide'].join(' ')}>
      <span style={{ flex: photos.length ? undefined : '1 1 220px' }}>
        {busy ? 'Adding photos…' : over ? 'Drop to add' : photos.length ? 'Drop, paste or' : 'No photos yet. Drop photos anywhere on this page, paste one, or'}
      </span>
      <span style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={busy || room <= 0}>Add photos…</Button>
        <Button size="sm" onClick={() => setLinkOpen((o) => !o)} disabled={room <= 0} active={linkOpen}>Add link…</Button>
      </span>
      {linkOpen && (
        <form
          style={{ display: 'flex', gap: 4, width: '100%' }}
          onSubmit={(e) => {
            e.preventDefault()
            if (addLink(link)) { setLink(''); setLinkOpen(false) }
          }}
        >
          <TextInput
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://i.imgur.com/…"
            aria-label="Photo link"
            type="url"
            inputMode="url"
            autoFocus
            style={{ fontSize: 12, flex: 1, minWidth: 0 }}
          />
          <Button size="sm" type="submit" disabled={!link.trim()}>Add</Button>
        </form>
      )}
    </DropZone>
  )

  return (
    <div>
      <Grid>
        {photos.map((p, i) => (
          <Tile key={p.id}>
            <ThumbButton onClick={() => setViewing(i)} aria-label={`View photo ${i + 1}`}>
              <PhotoImg photo={p} alt={p.caption || alt} loading="lazy" fallback={<Missing>{p.url ? 'Link not loading' : 'Photo missing'}</Missing>} />
              {i === 0 && <Tag className="cover">Cover</Tag>}
              <Tag className="right" title={where(p).title}>{where(p).tag}</Tag>
            </ThumbButton>
            <CaptionInput value={p.caption ?? ''} onCommit={(c) => setCaption(p.id, c)} />
            <TileActions>
              <Button size="sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move left">◀</Button>
              <Button size="sm" onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label="Move right">▶</Button>
              <Button size="sm" className="grow" onClick={() => move(i, 0)} disabled={i === 0}>Make cover</Button>
              <Button size="sm" onClick={() => remove(p.id)} aria-label="Remove photo">✕</Button>
            </TileActions>
          </Tile>
        ))}
        {zone}
      </Grid>
      <Hint>
        {signedIn ? (
          'Photos are saved to your account, so they show on all your devices and on your shared bike page.'
        ) : (
          <>
            {accounts ? (
              <>
                Uploads stay on this device.{' '}
                <a href="#sign-in" onClick={(e) => { e.preventDefault(); setSignInOpen(true) }} style={{ color: 'var(--win-link)' }}>Sign in</a>{' '}
                to save them to your account and show them on your shared bike page, or add photos as links:{' '}
              </>
            ) : (
              <>Uploads stay on this device. To show photos on your shared bike page, add them as links:{' '}</>
            )}
            <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--win-link)' }}>upload to Imgur</a>, then paste the image link.
          </>
        )}
      </Hint>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { void addFiles(imageFiles(e.target.files)); e.target.value = '' }}
      />
      <Modal open={viewing != null} onClose={() => setViewing(undefined)} title={alt} style={{ maxWidth: 960 }}>
        {viewing != null && <PhotoGallery photos={photos} alt={alt} initialIndex={viewing} linkOriginal />}
      </Modal>
    </div>
  )
}

function CaptionInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <TextInput
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { const v = draft.trim().slice(0, 140); if (v !== value) onCommit(v) }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      placeholder="Caption"
      aria-label="Caption"
      maxLength={140}
      style={{ fontSize: 11, height: 24 }}
    />
  )
}
