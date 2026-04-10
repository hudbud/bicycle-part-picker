import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useBuildStore } from '@/store/buildStore'
import { useGarageStore } from '@/store/garageStore'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { compressImage } from '@/utils/imageUtils'
import { Radio } from 'react95'
import styled from 'styled-components'

const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const VisibilityRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`

const PhotoPreview = styled.img`
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border: 2px inset #888;
  display: block;
`

const PhotoArea = styled.div`
  border: 2px inset #888;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

interface SaveBuildDialogProps {
  open: boolean
  onClose: () => void
  onNeedAuth: () => void
}

export function SaveBuildDialog({ open, onClose, onNeedAuth }: SaveBuildDialogProps) {
  const { build, setBuildName, loadBuild, setPhoto } = useBuildStore()
  const { saveBuild } = useGarageStore()
  const { isAuthenticated, user } = useAuthStore()
  const { success, error } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(build.name)
  const [description, setDescription] = useState(build.description ?? '')
  const [isPublic, setIsPublic] = useState(build.isPublic)
  const [photo, setLocalPhoto] = useState<string | undefined>(build.photo)
  const [compressing, setCompressing] = useState(false)

  useEffect(() => {
    if (open) {
      setName(build.name)
      setDescription(build.description ?? '')
      setIsPublic(build.isPublic)
      setLocalPhoto(build.photo)
    }
  }, [open, build])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressing(true)
    try {
      const compressed = await compressImage(file)
      setLocalPhoto(compressed)
    } catch {
      error('Could not process image')
    } finally {
      setCompressing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = () => {
    if (!isAuthenticated) { onClose(); onNeedAuth(); return }
    setBuildName(name)
    setPhoto(photo)
    const saved = saveBuild({ ...build, name, description, isPublic, ownerName: user?.displayName, photo })
    loadBuild(saved)
    success('Build saved!')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Save Build" style={{ maxWidth: 440, width: '100%' }}>
      <FormBody>
        <Input label="Build name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>Bike type</label>
          <p style={{ fontSize: 13, marginTop: 4, textTransform: 'capitalize' }}>{build.bikeType}</p>
        </div>
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes about your build…"
          rows={3}
        />

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Build Photo</label>
          <PhotoArea>
            {photo && <PhotoPreview src={photo} alt="Build preview" />}
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
              >
                {compressing ? 'Processing…' : photo ? 'Change photo' : 'Add photo'}
              </Button>
              {photo && (
                <Button size="sm" variant="secondary" onClick={() => setLocalPhoto(undefined)}>
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </PhotoArea>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Visibility</label>
          <VisibilityRow>
            <Radio
              checked={isPublic}
              onChange={() => setIsPublic(true)}
              label="Public"
              value="public"
              name="visibility"
            />
            <Radio
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
              label="Private"
              value="private"
              name="visibility"
            />
          </VisibilityRow>
        </div>
        <Button onClick={handleSave} fullWidth>Save build</Button>
      </FormBody>
    </Modal>
  )
}
