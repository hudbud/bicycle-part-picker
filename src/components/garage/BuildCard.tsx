import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Build } from '@/types/build'
import { BikeTypePill } from '@/components/ui/BikeTypePill'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DeleteConfirm } from './DeleteConfirm'
import { useBuildStore } from '@/store/buildStore'
import { useGarageStore } from '@/store/garageStore'
import { useToast } from '@/hooks/useToast'
import { getCategoriesForBikeType } from '@/data/categoryConfig'
import { encodeBuildForShare } from '@/utils/buildCodec'
import { Window, WindowHeader, WindowContent } from 'react95'
import styled from 'styled-components'

const Card = styled(Window)`
  width: 100%;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
`

const PhotoThumb = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
  border-bottom: 2px solid #888;
`

interface BuildCardProps {
  build: Build
}

export function BuildCard({ build }: BuildCardProps) {
  const navigate = useNavigate()
  const { loadBuild, hasUnsavedWork } = useBuildStore()
  const { deleteBuild, saveBuild } = useGarageStore()
  const { success } = useToast()
  const [confirmLoad, setConfirmLoad] = useState(false)

  const totalCategories = getCategoriesForBikeType(build.bikeType).length
  const filled = build.components.filter((s) => s.part).length
  const extrasCount = build.additionalItems?.length ?? 0
  const total = build.components.reduce((s, slot) => s + (slot.part?.price ?? 0), 0)
    + (build.additionalItems ?? []).reduce((s, item) => s + (item.price ?? 0), 0)

  const handleLoad = () => {
    if (hasUnsavedWork()) { setConfirmLoad(true); return }
    loadBuild(build)
    navigate('/build')
  }
  const handleDuplicate = () => {
    const copy = saveBuild({ ...build, id: undefined, name: `Copy of ${build.name}`, createdAt: undefined })
    loadBuild(copy)
    navigate('/build')
    success('Build duplicated')
  }
  const handleShare = async () => {
    const url = `${window.location.origin}/build/shared?b=${encodeBuildForShare(build)}`
    await navigator.clipboard.writeText(url).catch(() => {})
    success(build.photo ? 'Link copied! (photo not included)' : 'Link copied!')
  }

  const updatedAt = build.updatedAt
    ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round((new Date(build.updatedAt).getTime() - Date.now()) / 86400000), 'day')
    : null

  return (
    <Card>
      <WindowHeader active={false} style={{ fontSize: 12 }}>
        <span>{build.name}</span>
        <BikeTypePill type={build.bikeType} style={{ marginLeft: 8 }} />
      </WindowHeader>
      {build.photo && <PhotoThumb src={build.photo} alt={`${build.name} photo`} />}
      <WindowContent>
        {updatedAt && <p style={{ fontSize: 11, marginBottom: 4 }}>Updated {updatedAt}</p>}
        {build.description && <p style={{ fontSize: 12, marginBottom: 8 }}>{build.description}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span>
            {filled} of {totalCategories} components
            {extrasCount > 0 && <span style={{ opacity: 0.7 }}> + {extrasCount} extra{extrasCount !== 1 ? 's' : ''}</span>}
          </span>
          {total > 0 && <span style={{ fontWeight: 700 }}>${total.toLocaleString()}</span>}
        </div>
        <Actions>
          <Button size="sm" onClick={handleLoad}>Load Build</Button>
          <Button variant="secondary" size="sm" onClick={handleShare}>Share</Button>
          <Button variant="secondary" size="sm" onClick={handleDuplicate}>Duplicate</Button>
          <DeleteConfirm onConfirm={() => deleteBuild(build.id!)} />
        </Actions>
      </WindowContent>

      <ConfirmDialog
        open={confirmLoad}
        title="Replace current build?"
        message="You have unsaved changes to the current build. Loading this one will replace them."
        confirmLabel="Replace"
        onConfirm={() => { loadBuild(build); navigate('/build'); setConfirmLoad(false) }}
        onCancel={() => setConfirmLoad(false)}
      />
    </Card>
  )
}
