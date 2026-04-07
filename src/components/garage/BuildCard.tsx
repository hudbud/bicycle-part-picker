import { useNavigate } from 'react-router-dom'
import type { Build, PartStatus } from '@/types/build'
import { BikeTypePill } from '@/components/ui/BikeTypePill'
import { Button } from '@/components/ui/Button'
import { DeleteConfirm } from './DeleteConfirm'
import { useBuildStore } from '@/store/buildStore'
import { useGarageStore } from '@/store/garageStore'
import { useToast } from '@/hooks/useToast'
import { getCategoriesForBikeType } from '@/data/categoryConfig'

const STATUS_DOT_COLORS: Record<PartStatus, string> = {
  owned: 'bg-status-owned',
  purchased: 'bg-status-purchased',
  partsbin: 'bg-status-partsbin',
  wanted: 'bg-status-wanted',
}

interface BuildCardProps {
  build: Build
}

export function BuildCard({ build }: BuildCardProps) {
  const navigate = useNavigate()
  const { loadBuild } = useBuildStore()
  const { deleteBuild, saveBuild } = useGarageStore()
  const { success } = useToast()

  const totalCategories = getCategoriesForBikeType(build.bikeType).length
  const filled = build.components.filter((s) => s.part).length
  const total = build.components.reduce((s, slot) => s + (slot.part?.price ?? 0), 0)

  const handleLoad = () => {
    loadBuild(build)
    navigate('/build')
  }

  const handleDuplicate = () => {
    saveBuild({ ...build, id: undefined, name: `Copy of ${build.name}`, createdAt: undefined })
    success('Build duplicated')
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/build/${build.id}`
    await navigator.clipboard.writeText(url).catch(() => {})
    success('Link copied!')
  }

  const updatedAt = build.updatedAt
    ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round((new Date(build.updatedAt).getTime() - Date.now()) / 86400000),
        'day',
      )
    : null

  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4 hover:border-border-strong transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-medium text-text-primary truncate">{build.name}</h3>
          {updatedAt && <p className="text-xs text-text-muted mt-0.5">Updated {updatedAt}</p>}
        </div>
        <BikeTypePill type={build.bikeType} />
      </div>

      {build.description && (
        <p className="text-sm text-text-secondary line-clamp-2">{build.description}</p>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">{filled} of {totalCategories} components</span>
        {total > 0 && (
          <span className="font-medium text-text-primary">${total.toLocaleString()}</span>
        )}
      </div>

      {build.components.some((s) => s.status) && (
        <div className="flex gap-1 flex-wrap">
          {build.components.map((slot) =>
            slot.status ? (
              <span
                key={slot.category}
                className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[slot.status]}`}
                title={`${slot.category}: ${slot.status}`}
              />
            ) : null,
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onClick={handleLoad}>Load Build</Button>
        <Button variant="secondary" size="sm" onClick={handleShare}>Share</Button>
        <Button variant="ghost" size="sm" onClick={handleDuplicate}>Duplicate</Button>
        <DeleteConfirm onConfirm={() => deleteBuild(build.id!)} />
      </div>
    </div>
  )
}
