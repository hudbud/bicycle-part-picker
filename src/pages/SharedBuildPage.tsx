import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useMemo } from 'react'
import type { Build } from '@/types/build'
import { useGarageStore } from '@/store/garageStore'
import { BikeTypePill } from '@/components/ui/BikeTypePill'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getCategoriesForBikeType } from '@/data/categoryConfig'
import { EmptyState } from '@/components/ui/EmptyState'

function SharedBuildView({ build }: { build: Build }) {
  const categories = getCategoriesForBikeType(build.bikeType)
  const total = build.components.reduce((s, c) => s + (c.part?.price ?? 0), 0)
  const createdAt = build.createdAt
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(build.createdAt))
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted border border-border-default rounded-full px-2.5 py-0.5">
            Shared Build
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-text-primary">{build.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          <BikeTypePill type={build.bikeType} />
          {build.ownerName && <span>by {build.ownerName}</span>}
          {createdAt && <span>{createdAt}</span>}
        </div>
        {build.description && (
          <p className="text-text-secondary">{build.description}</p>
        )}
      </div>

      <div className="border border-border-default rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-strong bg-bg-surface">
              <th scope="col" className="table-header px-4 py-2.5 text-left w-40">Category</th>
              <th scope="col" className="table-header px-4 py-2.5 text-left">Part</th>
              <th scope="col" className="table-header px-4 py-2.5 text-right w-24">Price</th>
              <th scope="col" className="table-header px-4 py-2.5 text-left w-32">Status</th>
            </tr>
          </thead>
          <tbody>
            {build.components.map((slot, i) => {
              const cat = categories.find((c) => c.id === slot.category)
              if (!cat) return null
              return (
                <tr key={slot.category} className={i % 2 === 0 ? 'bg-bg-subtle/40' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-text-secondary">{cat.label}</td>
                  <td className="px-4 py-3 text-sm text-text-primary">
                    {slot.part ? `${slot.part.brand} ${slot.part.name}` : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-right text-text-primary">
                    {slot.part?.price ? `$${slot.part.price.toLocaleString()}` : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {slot.status && <StatusBadge status={slot.status} />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex justify-end">
          <div className="bg-bg-surface border border-border-default rounded-lg px-6 py-4 text-right">
            <span className="text-text-muted text-sm uppercase tracking-wide">Total</span>
            <p className="text-2xl font-semibold text-text-primary">${total.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border-default">
        <Link
          to="/build"
          className="inline-flex items-center gap-2 text-accent hover:underline font-medium"
        >
          Build something like this
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href)
          }}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Copy link
        </button>
      </div>
    </div>
  )
}

export function SharedBuildPage() {
  const { buildId } = useParams()
  const [searchParams] = useSearchParams()
  const { getBuildById } = useGarageStore()

  const build = useMemo<Build | null>(() => {
    if (buildId && buildId !== 'shared') {
      return getBuildById(buildId) ?? null
    }
    const b = searchParams.get('b')
    if (b) {
      try {
        return JSON.parse(decodeURIComponent(atob(b))) as Build
      } catch {
        return null
      }
    }
    return null
  }, [buildId, searchParams, getBuildById])

  if (!build) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          heading="Build not found"
          subtext="This build doesn't exist or has been made private."
          action={{ label: 'Start your own build', onClick: () => window.location.assign('/build') }}
        />
      </div>
    )
  }

  return <SharedBuildView build={build} />
}
