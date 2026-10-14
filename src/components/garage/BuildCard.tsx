import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Build } from '@/types/build'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DeleteConfirm } from './DeleteConfirm'
import { DueHints } from './DueHints'
import { getDueHints } from './serviceDue'
import { useBuildStore } from '@/store/buildStore'
import { useGarageStore } from '@/store/garageStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useToast } from '@/hooks/useToast'
import { getTrackingTotals } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { formatDistance } from '@/utils/distance'
import { computeCompat } from '@/hooks/useCompat'
import { CompatLevelIcon, RouterAnchor } from '@/components/build/BuildCells'
import { compatLevel, weightLabel, weightTooltip } from '@/components/build/buildRows'
import { compatSummary } from '@/components/build/buildMarkup'
import { StageBadge } from '@/components/tracking/StageBadge'
import { SERVICE_KIND_LABELS } from '@/components/tracking/serviceKinds'
import { ShareDialog } from '@/components/share/ShareDialog'
import { PhotoImg } from '@/components/photos/PhotoImg'
import { coverPhoto } from '@/utils/bikePhotos'
import { Window, WindowContent } from 'react95'
import styled from 'styled-components'

const Card = styled(Window)`
  width: 100%;
`

const Body = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px 14px;
  align-items: start;

  &.no-photo { grid-template-columns: minmax(0, 1fr) auto; }

  @media (max-width: 639px) {
    grid-template-columns: auto minmax(0, 1fr);
    &.no-photo { grid-template-columns: minmax(0, 1fr); }
    & > .money { grid-column: 1 / -1; }
  }
`

const Thumb = styled(PhotoImg)`
  width: 112px;
  height: 80px;
  object-fit: cover;
  display: block;
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);

  @media (max-width: 639px) {
    width: 72px;
    height: 54px;
  }
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  min-width: 0;
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
`

const Money = styled.table`
  border-collapse: collapse;
  font-size: 12px;
  td { padding: 1px 0 1px 10px; white-space: nowrap; }
  td:first-child { padding-left: 0; }
  td.v { text-align: right; font-weight: 700; font-size: 14px; font-variant-numeric: tabular-nums; }
  td.n { font-size: 11px; color: var(--win-muted); }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
`

interface BuildCardProps {
  build: Build
}

/** One bike in the Garage: stage, odometer, spent vs to-buy, last service and "due" hints. */
export function BuildCard({ build }: BuildCardProps) {
  const navigate = useNavigate()
  const { loadBuild, hasUnsavedWork } = useBuildStore()
  const { deleteBuild, saveBuild } = useGarageStore()
  const unit = useSettingsStore((s) => s.distanceUnit)
  const { success } = useToast()
  const [confirmLoad, setConfirmLoad] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const filled = build.components.filter((s) => s.part).length
  const extrasCount = build.additionalItems?.length ?? 0
  const totals = useMemo(() => getTrackingTotals(build), [build])
  const compat = useMemo(() => computeCompat(build), [build])
  const hints = useMemo(() => getDueHints(build), [build])
  const level = compatLevel(build, compat)
  const lastService = build.serviceLog?.[0]
  const bikePath = `/garage/${build.id}`
  const photo = coverPhoto(build)

  const openInBuilder = () => {
    if (hasUnsavedWork()) { setConfirmLoad(true); return }
    loadBuild(build)
    navigate('/build')
  }
  const handleDuplicate = () => {
    // A copy is a new plan: same parts, none of the history.
    const { serviceLog: _l, odometerKm: _o, ...rest } = build
    const components = build.components.map(({ tracking: _t, status: _s, ...slot }) => slot)
    const copy = saveBuild({ ...rest, components, id: undefined, name: `Copy of ${build.name}`, createdAt: undefined, stage: 'planning' })
    success('Bike duplicated')
    navigate(`/garage/${copy.id}`)
  }

  const updatedAt = build.updatedAt
    ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round((new Date(build.updatedAt).getTime() - Date.now()) / 86400000), 'day')
    : null

  return (
    <Card>
      <WindowContent style={{ padding: 10 }}>
        <Body className={photo ? undefined : 'no-photo'}>
          {photo && <Thumb photo={photo} alt={`${build.name} photo`} loading="lazy" fallback={<span />} />}

          <Info>
            <RouterAnchor to={bikePath} style={{ fontSize: 15, fontWeight: 700, overflowWrap: 'anywhere' }}>{build.name}</RouterAnchor>
            <Meta>
              <StageBadge stage={build.stage} />
              <span>Odometer: <strong>{formatDistance(build.odometerKm, unit)}</strong></span>
              <span>
                {filled} part{filled === 1 ? '' : 's'}
                {extrasCount > 0 && <span style={{ color: 'var(--win-muted)' }}> + {extrasCount} extra{extrasCount !== 1 ? 's' : ''}</span>}
              </span>
              {updatedAt && <span style={{ fontSize: 11, color: 'var(--win-muted)' }}>Updated {updatedAt}</span>}
            </Meta>
            <div>
              Last service:{' '}
              {lastService ? (
                <span>
                  <strong>{lastService.date}</strong> — {SERVICE_KIND_LABELS[lastService.kind]}: {lastService.title}
                  {lastService.odometerKm != null && <span style={{ color: 'var(--win-muted)' }}> @ {formatDistance(lastService.odometerKm, unit)}</span>}
                </span>
              ) : <span style={{ color: 'var(--win-muted)' }}>none logged</span>}
            </div>
            <DueHints hints={hints} />
            {level !== 'empty' && (
              <Meta style={{ fontSize: 11 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CompatLevelIcon level={level} title={`Compatibility: ${compatSummary(build, compat)}`} />
                  {level === 'ok' ? 'Compatible' : compatSummary(build, compat)}
                </span>
                <span title={weightTooltip(compat)}>Est. weight: <strong>{weightLabel(compat)}</strong></span>
              </Meta>
            )}
          </Info>

          <Money className="money">
            <tbody>
              <tr>
                <td>Spent</td>
                <td className="v">{totals.acquiredCount ? formatPrice(totals.spent) : '—'}</td>
                <td className="n">{totals.unrecorded ? `${totals.unrecorded} unpriced` : ''}</td>
              </tr>
              <tr>
                <td>To buy</td>
                <td className="v">{totals.toBuyCount ? `${totals.toBuyUnpriced ? '~' : ''}${formatPrice(totals.toBuy)}` : '—'}</td>
                <td className="n">{totals.toBuyCount ? `${totals.toBuyCount} part${totals.toBuyCount === 1 ? '' : 's'}` : ''}</td>
              </tr>
              {totals.service > 0 && (
                <tr><td>Service</td><td className="v" style={{ fontSize: 12 }}>{formatPrice(totals.service)}</td><td /></tr>
              )}
            </tbody>
          </Money>
        </Body>

        <Actions>
          <Button size="sm" onClick={() => navigate(bikePath)}>Open</Button>
          <Button variant="secondary" size="sm" onClick={openInBuilder}>Open in Builder</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowShare(true)} disabled={filled === 0}>Share / Post</Button>
          <Button variant="secondary" size="sm" onClick={handleDuplicate}>Duplicate</Button>
          <DeleteConfirm onConfirm={() => deleteBuild(build.id!)} />
        </Actions>
      </WindowContent>

      <ShareDialog open={showShare} onClose={() => setShowShare(false)} build={build} />
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
