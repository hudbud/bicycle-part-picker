import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Window, WindowHeader, WindowContent, GroupBox, Button, TextInput } from 'react95'
import styled from 'styled-components'
import type { BuildStage } from '@/types/build'
import { updateBike, type BikeRef } from '@/store/bikeSync'
import { useBuildStore } from '@/store/buildStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useToast } from '@/hooks/useToast'
import { useBike } from '@/components/tracking/bikeEdits'
import { withOdometer, withStage } from '@/utils/bikeOps'
import { fromKm, toKm } from '@/utils/distance'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RouterAnchor } from '@/components/build/BuildCells'
import { BuildTotals } from '@/components/build/BuildTotals'
import { CompatBanner } from '@/components/build/CompatBanner'
import { DistanceUnitToggle } from '@/components/tracking/DistanceUnitToggle'
import { FieldInput, FieldLabel, FieldSelect, parseNum } from '@/components/tracking/fields'
import { STAGES } from '@/components/tracking/serviceKinds'
import { BikePartsTable } from '@/components/garage/BikePartsTable'
import { ServiceLog } from '@/components/garage/ServiceLog'
import { DueHints } from '@/components/garage/DueHints'
import { getDueHints } from '@/components/garage/serviceDue'
import { ShareDialog } from '@/components/share/ShareDialog'
import { PhotoImg } from '@/components/photos/PhotoImg'
import { PhotoManager } from '@/components/photos/PhotoManager'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`

const Header = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px 14px;
  align-items: start;
  margin-bottom: 10px;

  @media (max-width: 639px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const CoverButton = styled.button`
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
`

const Photo = styled(PhotoImg)`
  width: 168px;
  height: 118px;
  object-fit: cover;
  display: block;
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);

  @media (max-width: 639px) {
    width: 120px;
    height: 84px;
  }
`

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 12px;
`

function NotFound() {
  return (
    <Window style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <WindowHeader active><span>Bike not found</span></WindowHeader>
      <WindowContent>
        <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 12px' }}>
          There&rsquo;s no bike with that link in your Garage. It may have been deleted, or it was saved in another browser
          (bikes live in this browser&rsquo;s storage).
        </p>
        <RouterAnchor to="/garage">← Back to the Garage</RouterAnchor>
      </WindowContent>
    </Window>
  )
}

/** Odometer input in the display unit; commits (as km) on blur / Enter. */
function OdometerInput({ km, onCommit }: { km: number | undefined; onCommit: (km: number | undefined) => void }) {
  const unit = useSettingsStore((s) => s.distanceUnit)
  const shown = km != null ? String(Math.round(fromKm(km, unit))) : ''
  const [value, setValue] = useState(shown)
  useEffect(() => setValue(shown), [shown])
  const commit = () => {
    const n = parseNum(value)
    if (value.trim() === '') onCommit(undefined)
    else if (n != null && n >= 0) onCommit(toKm(Math.round(n), unit))
    else setValue(shown)
  }
  return (
    <FieldLabel>
      Odometer ({unit})
      <FieldInput
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        placeholder="not set"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        style={{ width: 110 }}
      />
    </FieldLabel>
  )
}

/** Text field that commits on blur / Enter; resets to `value` when the commit is rejected. */
function CommitField({ label, value, onCommit, grow, ...rest }: {
  label: string
  value: string
  onCommit: (v: string) => boolean | void
  grow?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <FieldLabel style={grow ? { flex: '1 1 220px', maxWidth: 360 } : { flex: '0 1 160px' }}>
      {label}
      <FieldInput
        {...rest}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { if (draft.trim() !== value && onCommit(draft.trim()) === false) setDraft(value) }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      />
    </FieldLabel>
  )
}

/** /garage/:bikeId — one saved bike as a tracker: stage, odometer, per-part tracking, service log, totals. */
export function BikePage() {
  const { bikeId = '' } = useParams()
  const ref = useMemo<BikeRef>(() => ({ kind: 'garage', id: bikeId }), [bikeId])
  const build = useBike(ref)
  const navigate = useNavigate()
  const { loadBuild, hasUnsavedWork } = useBuildStore()
  const { success } = useToast()
  const photosRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState(build?.name ?? '')
  const [confirmLoad, setConfirmLoad] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const hints = useMemo(() => (build ? getDueHints(build) : []), [build])

  useEffect(() => { if (build) setName(build.name) }, [build?.name]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!build) return <NotFound />

  const filled = build.components.filter((s) => s.part).length
  const commitName = () => {
    const n = name.trim().slice(0, 80)
    if (n && n !== build.name) updateBike(ref, (b) => ({ ...b, name: n }))
    else setName(build.name)
  }

  const openInBuilder = () => {
    if (hasUnsavedWork()) { setConfirmLoad(true); return }
    loadBuild(build)
    navigate('/build')
  }

  const photos = build.photos ?? []
  const updatePhotos = (fn: (ps: typeof photos) => typeof photos) =>
    updateBike(ref, ({ photos: prev, ...b }) => {
      const next = fn(prev ?? [])
      return next.length ? { ...b, photos: next } : b
    })

  return (
    <div style={{ paddingBottom: 24 }}>
      <PageWindow>
        <WindowHeader active><span>Garage — {build.name}</span></WindowHeader>
        <WindowContent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 12 }}>
            <RouterAnchor to="/garage">← Garage</RouterAnchor>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <DistanceUnitToggle />
              <Button size="sm" onClick={openInBuilder} style={{ fontSize: 12 }}>Open in Builder</Button>
              <Button size="sm" primary onClick={() => setShowShare(true)} disabled={filled === 0} style={{ fontSize: 12, fontWeight: 700 }}>
                Share / Post to Reddit
              </Button>
            </span>
          </div>

          <Header>
            {photos.length > 0 ? (
              <CoverButton onClick={() => photosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} title="Photos">
                <Photo photo={photos[0]} alt={`${build.name} photo`} />
              </CoverButton>
            ) : <span />}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                maxLength={80}
                aria-label="Bike name"
                style={{ fontSize: 16, fontWeight: 700, maxWidth: 520 }}
                fullWidth
              />
              <Controls>
                <FieldLabel>
                  Stage
                  <FieldSelect
                    value={build.stage ?? ''}
                    onChange={(e) => updateBike(ref, (b) => withStage(b, (e.target.value || undefined) as BuildStage | undefined))}
                    style={{ width: 120 }}
                  >
                    <option value="">—</option>
                    {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </FieldSelect>
                </FieldLabel>
                <OdometerInput
                  km={build.odometerKm}
                  onCommit={(km) => { updateBike(ref, (b) => withOdometer(b, km)); if (km != null) success('Odometer updated') }}
                />
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 12, paddingBottom: 4 }}>
                  {filled} part{filled === 1 ? '' : 's'}
                </span>
              </Controls>
              <Controls>
                <CommitField
                  label="Reddit username"
                  placeholder="u/yourname"
                  maxLength={40}
                  autoCapitalize="off"
                  spellCheck={false}
                  value={build.ownerName ? `u/${build.ownerName}` : ''}
                  onCommit={(v) => {
                    const ownerName = v.replace(/^\/?u\//i, '').trim()
                    updateBike(ref, ({ ownerName: _o, ...b }) => (ownerName ? { ...b, ownerName } : b))
                  }}
                />
              </Controls>
              <DueHints hints={hints} />
              {build.description && <p style={{ fontSize: 12, margin: 0, color: 'var(--win-muted)' }}>{build.description}</p>}
            </div>
          </Header>

          <div ref={photosRef} style={{ scrollMarginTop: 8 }}>
            <GroupBox label={`Photos (${photos.length})`} style={{ marginBottom: 12 }}>
              <PhotoManager photos={photos} update={updatePhotos} alt={build.name} />
            </GroupBox>
          </div>

          <CompatBanner build={build} />

          <GroupBox label={`Parts (${filled})`} style={{ marginTop: 12 }}>
            <BikePartsTable build={build} bike={ref} />
            <div style={{ marginTop: 8 }}><BuildTotals build={build} mode="tracking" /></div>
          </GroupBox>

          <GroupBox label={`Service Log (${build.serviceLog?.length ?? 0})`} style={{ marginTop: 14 }}>
            <ServiceLog key={build.id} build={build} bike={ref} />
          </GroupBox>
        </WindowContent>
      </PageWindow>

      <ShareDialog open={showShare} onClose={() => setShowShare(false)} build={build} />
      <ConfirmDialog
        open={confirmLoad}
        title="Replace current build?"
        message="The Builder has an unsaved bike. Opening this one will replace it."
        confirmLabel="Replace"
        onConfirm={() => { loadBuild(build); navigate('/build'); setConfirmLoad(false) }}
        onCancel={() => setConfirmLoad(false)}
      />
    </div>
  )
}
