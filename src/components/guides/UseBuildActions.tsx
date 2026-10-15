import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'react95'
import type { Build } from '@/types/build'
import { useBuildStore } from '@/store/buildStore'
import { useToast } from '@/hooks/useToast'
import { buildShareUrl } from '@/utils/buildCodec'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

/**
 * A copy of `build` for the builder: no id (so it's a new, unsaved build — the Garage
 * assigns an id when it's saved) and no timestamps/owner from the original.
 */
export function copyForBuilder(build: Build): Build {
  const { id: _id, createdAt: _c, updatedAt: _u, ownerName: _o, ...rest } = build
  return {
    ...rest,
    components: build.components.map((s) => ({ ...s })),
    additionalItems: build.additionalItems?.map((i) => ({ ...i, id: crypto.randomUUID() })),
  }
}

/**
 * "Use This Build" + "Share" for read-only builds (guides, completed builds).
 * Use This Build confirms before replacing a builder that already has parts.
 */
export function UseBuildActions({ build, label = 'build' }: { build: Build; label?: string }) {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [unsaved, setUnsaved] = useState(false)

  const load = () => {
    useBuildStore.getState().loadBuild(copyForBuilder(build))
    success(`Copied “${build.name}” into the builder`)
    navigate('/build')
  }

  const onUse = () => {
    const state = useBuildStore.getState()
    const hasParts = state.build.components.some((s) => s.part)
    if (!hasParts) return load()
    setUnsaved(state.hasUnsavedWork())
    setConfirmOpen(true)
  }

  const onShare = async () => {
    const url = buildShareUrl(build)
    try {
      await navigator.clipboard.writeText(url)
      success('Share link copied to clipboard')
    } catch {
      error('Could not copy the link — your browser blocked clipboard access')
    }
  }

  return (
    <>
      <Button size="sm" primary onClick={onUse} title={`Copy this ${label} into the builder to customize it`}>
        Use This Build
      </Button>
      <Button size="sm" onClick={onShare} title="Copy a permalink to this part list">
        Share
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        title="Replace current build?"
        message={
          unsaved
            ? 'Your current build has never been saved to the Garage. Using this build will replace it.'
            : 'This will replace the build open in the builder. Builds saved in your Garage are kept.'
        }
        confirmLabel="Replace"
        onConfirm={() => { setConfirmOpen(false); load() }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
