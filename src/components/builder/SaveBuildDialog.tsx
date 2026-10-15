import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useBuildStore } from '@/store/buildStore'
import { useGarageStore } from '@/store/garageStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useToast } from '@/hooks/useToast'
import { MAX_PHOTOS, uploadPhotos } from '@/utils/bikePhotos'
import { PhotoImg } from '@/components/photos/PhotoImg'
import type { BikePhoto } from '@/types/build'
import styled from 'styled-components'

const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PhotoPreview = styled(PhotoImg)`
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border: 2px inset var(--win-shadow);
  display: block;
`

const PhotoArea = styled.div`
  border: 2px inset var(--win-shadow);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

interface SaveBuildDialogProps {
  open: boolean
  onClose: () => void
}

export function SaveBuildDialog({ open, onClose }: SaveBuildDialogProps) {
  const { build, setBuildName, loadBuild, setPhotos } = useBuildStore()
  const { saveBuild } = useGarageStore()
  const { builderName, setBuilderName } = useSettingsStore()
  const { success, error } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(build.name)
  const [description, setDescription] = useState(build.description ?? '')
  const [photos, setLocalPhotos] = useState<BikePhoto[]>(build.photos ?? [])
  const [compressing, setCompressing] = useState(false)

  useEffect(() => {
    if (open) {
      setName(build.name)
      setDescription(build.description ?? '')
      setLocalPhotos(build.photos ?? [])
    }
  }, [open, build])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!files.length) return
    setCompressing(true)
    const { photos: added, failed } = await uploadPhotos(files)
    setCompressing(false)
    setLocalPhotos((ps) => [...ps, ...added].slice(0, MAX_PHOTOS))
    if (failed) error('Could not process image')
  }

  const handleSave = () => {
    setBuildName(name)
    setPhotos(photos)
    const { photos: _p, ...rest } = build
    const saved = saveBuild({ ...rest, name, description, ownerName: builderName || undefined, ...(photos.length ? { photos } : {}) })
    loadBuild(saved)
    success('Build saved!')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Save Build" style={{ maxWidth: 440, width: '100%' }}>
      <FormBody>
        <Input label="Build name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes about your build…"
          rows={3}
        />

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Photos</label>
          <PhotoArea>
            {photos[0] && <PhotoPreview photo={photos[0]} alt="Build preview" />}
            {photos.length > 1 && <span style={{ fontSize: 11 }}>+ {photos.length - 1} more — manage them on the bike's Garage page</span>}
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
              >
                {compressing ? 'Processing…' : photos.length ? 'Add more…' : 'Add photos…'}
              </Button>
              {photos.length > 0 && (
                <Button size="sm" variant="secondary" onClick={() => setLocalPhotos((ps) => ps.slice(1))}>
                  {photos.length > 1 ? 'Remove cover' : 'Remove'}
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </PhotoArea>
        </div>

        <Input
          label="Your name (optional, shown on shared builds)"
          value={builderName}
          onChange={(e) => setBuilderName(e.target.value)}
          placeholder="e.g. Jane"
        />
        <Button onClick={handleSave} fullWidth>Save build</Button>
      </FormBody>
    </Modal>
  )
}
