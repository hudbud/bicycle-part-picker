import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import type { Build } from '@/types/build'
import { useGarageStore } from '@/store/garageStore'
import { useBuildStore } from '@/store/buildStore'
import { useToast } from '@/hooks/useToast'
import { buildShareUrl, decodeSharedBuild } from '@/utils/buildCodec'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BuildPartList } from '@/components/build/BuildPartList'
import { ShareDialog } from '@/components/share/ShareDialog'
import { Window, WindowHeader, WindowContent, Button, Toolbar } from 'react95'
import styled from 'styled-components'
import { PhotoImg } from '@/components/photos/PhotoImg'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
`

const BuildPhoto = styled(PhotoImg)`
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  display: block;
  border-bottom: 2px solid var(--win-shadow);
`

function SharedBuildView({ build, isShareLink }: { build: Build; isShareLink: boolean }) {
  const navigate = useNavigate()
  const loadBuild = useBuildStore((s) => s.loadBuild)
  const hasUnsavedWork = useBuildStore((s) => s.hasUnsavedWork)
  const { success } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const createdAt = build.createdAt
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(build.createdAt))
    : null

  // A share link is someone else's build: open it as a fresh, unsaved copy.
  const openInBuilder = () => {
    loadBuild(isShareLink ? { ...build, id: undefined } : build)
    success('Build opened in the builder')
    navigate('/build')
  }

  const copyLink = async () => {
    const url = isShareLink ? window.location.href : buildShareUrl(build)
    await navigator.clipboard.writeText(url).catch(() => {})
    success('Link copied!')
  }

  return (
    <PageWindow>
      <WindowHeader active>
        <span>{isShareLink ? 'Shared Build' : 'Saved Build'} — {build.name}</span>
      </WindowHeader>
      <Toolbar style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingLeft: 4 }}>
          <strong style={{ fontSize: 14 }}>{build.name}</strong>
          {build.ownerName && <span style={{ fontSize: 12 }}>by {build.ownerName}</span>}
          {createdAt && <span style={{ fontSize: 12 }}>{createdAt}</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Button size="sm" onClick={() => (hasUnsavedWork() ? setConfirmOpen(true) : openInBuilder())}>
            Open in Builder
          </Button>
          <Button size="sm" variant="flat" onClick={() => setShowShare(true)}>Share / Post</Button>
          <Button size="sm" variant="flat" onClick={copyLink}>Copy link</Button>
        </div>
      </Toolbar>

      {build.photos?.[0] && <BuildPhoto photo={build.photos[0]} alt={`${build.name} photo`} />}

      <WindowContent>
        {build.description && (
          <p style={{ fontSize: 13, margin: '0 0 10px' }}>{build.description}</p>
        )}
        <BuildPartList build={build} showStatus />
      </WindowContent>

      <ShareDialog open={showShare} onClose={() => setShowShare(false)} build={build} />
      <ConfirmDialog
        open={confirmOpen}
        title="Replace current build?"
        message="Your current build has never been saved to the Garage. Opening this one will replace it."
        confirmLabel="Replace"
        onConfirm={() => { setConfirmOpen(false); openInBuilder() }}
        onCancel={() => setConfirmOpen(false)}
      />
    </PageWindow>
  )
}

export function SharedBuildPage() {
  const { buildId } = useParams()
  const [searchParams] = useSearchParams()
  const { getBuildById } = useGarageStore()
  const isShareLink = !buildId || buildId === 'shared'

  const build = useMemo<Build | null>(() => {
    if (!isShareLink) return getBuildById(buildId!) ?? null
    const b = searchParams.get('b')
    return b ? decodeSharedBuild(b) : null
  }, [isShareLink, buildId, searchParams, getBuildById])

  if (!build) {
    return (
      <PageWindow>
        <WindowHeader active><span>Build Not Found</span></WindowHeader>
        <WindowContent>
          <EmptyState
            heading="Build not found"
            subtext="This link is broken or the build no longer exists."
            action={{ label: 'Start your own build', onClick: () => window.location.assign('/build') }}
          />
        </WindowContent>
      </PageWindow>
    )
  }

  return <SharedBuildView build={build} isShareLink={isShareLink} />
}
