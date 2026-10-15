import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Window, WindowHeader, WindowContent, Frame, Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell } from 'react95'
import styled from 'styled-components'
import type { Build } from '@/types/build'
import { decodeBikeLink } from '@/utils/buildCodec'
import { useGarageStore } from '@/store/garageStore'
import { useBuildStore } from '@/store/buildStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useToast } from '@/hooks/useToast'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { computeCompat } from '@/hooks/useCompat'
import { CATEGORY_GROUPS, getCategoryMeta, productPath } from '@/data/categoryConfig'
import { formatWeight } from '@/data/specSchema'
import { formatPrice } from '@/utils/format'
import { formatDistance } from '@/utils/distance'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { CompatLevelIcon, RouterAnchor } from '@/components/build/BuildCells'
import { compatLevel, getSlotRows, partTitle, weightLabel, weightTooltip, type SlotRow } from '@/components/build/buildRows'
import { compatSummary } from '@/components/build/buildMarkup'
import { Prose } from '@/components/guides/DetailBits'
import { paragraphs } from '@/components/guides/buildSummary'
import { Strong } from '@/components/products/ProductBits'
import { StageBadge } from '@/components/tracking/StageBadge'
import { ConditionBadge } from '@/components/tracking/ConditionBadge'
import { DistanceUnitToggle } from '@/components/tracking/DistanceUnitToggle'
import { PhotoGallery } from '@/components/photos/PhotoGallery'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
`

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 6px;
  overflow-wrap: anywhere;
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  font-size: 12px;
  margin-bottom: 10px;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
`

const CompatLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  font-size: 12px;
  margin-bottom: 8px;
  span { display: inline-flex; align-items: center; gap: 4px; }
`

/** react95 rows use a fixed 34px line-height; notes need a tighter one under the name. */
const PartRow = styled(TableRow)`
  td { vertical-align: top; line-height: 1.35; padding-top: 8px; padding-bottom: 8px; }
`

const SectionRow = styled(TableRow)`
  background: var(--win-face);
  color: var(--win-text);
  td { font-size: 11px; font-weight: 700; padding: 4px 8px; }
`

const Note = styled.div`
  font-size: 11px;
  color: var(--win-muted);
  margin-top: 2px;
`

const Card = styled(Frame).attrs({ variant: 'field' })`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  width: 100%;
  font-size: 13px;
`

const GroupTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  margin: 8px 0 2px;
  &:first-child { margin-top: 0; }
`

const Totals = styled.table`
  margin: 8px 0 0 auto;
  border-collapse: collapse;
  font-size: 12px;
  td { padding: 2px 8px; }
  td:nth-child(2) { text-align: right; font-weight: 700; font-size: 14px; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.sub { font-size: 11px; color: var(--win-muted); padding-top: 0; text-align: right; }
`

const Num = { textAlign: 'right' as const, whiteSpace: 'nowrap' as const, fontVariantNumeric: 'tabular-nums' as const }

/** Reddit usernames are 3–20 of [A-Za-z0-9_-]; anything else is shown as a plain name. */
const isRedditName = (s: string) => /^[A-Za-z0-9_-]{3,20}$/.test(s)

const paidLabel = (n: number) => (n === 0 ? 'free' : formatPrice(n).replace(/\.00$/, ''))

/** Someone else's bike as a plan of your own: same parts, all Wanted, none of their history. */
function asPlan(build: Build): Build {
  const { ownerName: _o, odometerKm: _k, photos: _p, serviceLog: _l, id: _i, createdAt: _c, updatedAt: _up, ...rest } = build
  const components = build.components.map(({ tracking: _t, status: _s, ...slot }) => (slot.part ? { ...slot, status: 'wanted' as const } : slot))
  return { ...rest, components, stage: 'planning' }
}

function PartName({ row }: { row: SlotRow }) {
  const part = row.part!
  const qty = row.quantity > 1 && row.quantity !== getCategoryMeta(row.category)?.defaultQty ? `${row.quantity} × ` : ''
  if (part.isCustom) return <span>{qty}{partTitle(part)}</span>
  return (
    <span>
      {qty}
      <RouterAnchor to={productPath(part.id)}>
        {part.brand && <Strong>{part.brand}</Strong>} {part.name}
      </RouterAnchor>
    </span>
  )
}

function PartsList({ build }: { build: Build }) {
  const isMobile = useIsMobile()
  const rows = useMemo(() => getSlotRows(build, undefined, true), [build])
  const groups = useMemo(() => {
    const by = new Map<string, SlotRow[]>()
    for (const row of rows) {
      const g = getCategoryMeta(row.category)?.group ?? 'Other'
      by.set(g, [...(by.get(g) ?? []), row])
    }
    return [...CATEGORY_GROUPS, 'Other'].filter((g) => by.has(g)).map((g) => ({ title: g, rows: by.get(g)! }))
  }, [rows])
  const extras = build.additionalItems ?? []
  const showCond = rows.some((r) => r.slot.tracking?.condition)
  const showPaid = rows.some((r) => r.slot.tracking?.pricePaid != null)
  const paid = (r: SlotRow) => (r.slot.tracking?.pricePaid != null ? paidLabel(r.slot.tracking.pricePaid) : '')

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {groups.map((g) => (
          <div key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <GroupTitle>{g.title}</GroupTitle>
            {g.rows.map((r) => (
              <Card key={r.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{r.label}</span>
                  <ConditionBadge condition={r.slot.tracking?.condition} />
                </div>
                <PartName row={r} />
                {r.slot.tracking?.notes && <Note>{r.slot.tracking.notes}</Note>}
                {(paid(r) || r.weightG != null) && (
                  <div style={{ fontSize: 11 }}>
                    {[paid(r) && `Paid ${paid(r)}`, r.weightG != null && formatWeight(r.weightG)].filter(Boolean).join(' · ')}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))}
        {extras.length > 0 && <GroupTitle>Extras</GroupTitle>}
        {extras.map((x) => (
          <Card key={x.id}>
            <span>{x.url ? <a href={x.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--win-link)' }}>{x.name}</a> : x.name}</span>
            {x.notes && <Note>{x.notes}</Note>}
          </Card>
        ))}
      </div>
    )
  }

  const cols = 3 + Number(showCond) + Number(showPaid)
  return (
    <Table style={{ width: '100%' }}>
      <TableHead>
        <TableRow>
          <TableHeadCell style={{ width: 140 }}>Component</TableHeadCell>
          <TableHeadCell>Part</TableHeadCell>
          {showCond && <TableHeadCell style={{ width: 110 }}>Condition</TableHeadCell>}
          {showPaid && <TableHeadCell style={{ width: 80, ...Num }}>Paid</TableHeadCell>}
          <TableHeadCell style={{ width: 80, ...Num }}>Weight</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {groups.map((g) => (
          <GroupRows key={g.title} title={g.title} cols={cols}>
            {g.rows.map((r) => (
              <PartRow key={r.category}>
                <TableDataCell style={{ fontSize: 12 }}>{r.label}</TableDataCell>
                <TableDataCell style={{ fontSize: 13 }}>
                  <PartName row={r} />
                  {r.slot.tracking?.notes && <Note>{r.slot.tracking.notes}</Note>}
                </TableDataCell>
                {showCond && <TableDataCell><ConditionBadge condition={r.slot.tracking?.condition} /></TableDataCell>}
                {showPaid && <TableDataCell style={{ fontSize: 13, fontWeight: 700, ...Num }}>{paid(r)}</TableDataCell>}
                <TableDataCell style={{ fontSize: 12, ...Num }}>{r.weightG != null ? formatWeight(r.weightG) : ''}</TableDataCell>
              </PartRow>
            ))}
          </GroupRows>
        ))}
        {extras.length > 0 && (
          <GroupRows title="Extras" cols={cols}>
            {extras.map((x) => (
              <TableRow key={x.id}>
                <TableDataCell style={{ fontSize: 12 }}>Extra</TableDataCell>
                <TableDataCell style={{ fontSize: 13 }}>
                  {x.url ? <a href={x.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--win-link)' }}>{x.name}</a> : x.name}
                  {x.notes && <Note>{x.notes}</Note>}
                </TableDataCell>
                {Array.from({ length: cols - 2 }, (_, i) => <TableDataCell key={i} />)}
              </TableRow>
            ))}
          </GroupRows>
        )}
      </TableBody>
    </Table>
  )
}

function GroupRows({ title, cols, children }: { title: string; cols: number; children: React.ReactNode }) {
  return (
    <>
      <SectionRow><td colSpan={cols}>{title}</td></SectionRow>
      {children}
    </>
  )
}

function PublicBikeView({ build }: { build: Build }) {
  const navigate = useNavigate()
  const saveBuild = useGarageStore((s) => s.saveBuild)
  const { loadBuild, hasUnsavedWork } = useBuildStore()
  const unit = useSettingsStore((s) => s.distanceUnit)
  const { success } = useToast()
  const [confirmLoad, setConfirmLoad] = useState(false)
  const compat = useMemo(() => computeCompat(build), [build])
  const level = compatLevel(build, compat)

  useEffect(() => {
    const prev = document.title
    document.title = build.name
    return () => { document.title = prev }
  }, [build.name])

  const filled = build.components.filter((s) => s.part)
  const paid = filled.filter((s) => s.tracking?.pricePaid != null)
  const paidTotal = paid.reduce((n, s) => n + s.tracking!.pricePaid!, 0)
  const owner = build.ownerName?.replace(/^\/?u\//i, '')

  const copyToGarage = () => {
    const saved = saveBuild(asPlan(build))
    success('Saved to your Garage as a plan — every part is marked Wanted')
    navigate(`/garage/${saved.id}`)
  }
  const openInBuilder = () => {
    loadBuild(asPlan(build))
    success('Bike opened in the builder')
    navigate('/build')
  }

  return (
    <PageWindow>
      <WindowHeader active><span>{build.name}</span></WindowHeader>
      <WindowContent>
        {build.photos?.length ? (
          <div style={{ marginBottom: 12 }}>
            <PhotoGallery photos={build.photos} alt={`${build.name} photo`} linkOriginal />
          </div>
        ) : null}

        <Title>{build.name}</Title>
        <Meta>
          {owner && (isRedditName(owner)
            ? <a href={`https://www.reddit.com/user/${owner}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--win-link)' }}>u/{owner}</a>
            : <span>by {owner}</span>)}
          <StageBadge stage={build.stage} />
          {build.odometerKm != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span>Odometer: <Strong>{formatDistance(build.odometerKm, unit)}</Strong></span>
              <DistanceUnitToggle label="" />
            </span>
          )}
          <span>{filled.length} part{filled.length === 1 ? '' : 's'}</span>
        </Meta>

        {build.description && (
          <Prose>{paragraphs(build.description).map((p, i) => <p key={i}>{p}</p>)}</Prose>
        )}

        <Actions>
          <Button size="sm" onClick={copyToGarage} title="Save these parts to your Garage as a plan (all marked Wanted)">Copy to my garage</Button>
          <Button size="sm" variant="secondary" onClick={() => (hasUnsavedWork() ? setConfirmLoad(true) : openInBuilder())}>Open in Builder</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/garage/import')}>Start your own garage</Button>
        </Actions>

        {/* Compatibility is a one-liner here; the full checker lives in the builder. */}
        {level !== 'empty' && (
          <CompatLine>
            <span>
              <CompatLevelIcon level={level} title={`Compatibility: ${compatSummary(build, compat)}`} />
              {level === 'ok' ? 'No compatibility issues found' : `Compatibility: ${compatSummary(build, compat)}`}
            </span>
          </CompatLine>
        )}

        <PartsList build={build} />

        <Totals>
          <tbody>
            {compat.weight.grams > 0 && (
              <tr title={weightTooltip(compat)}><td>Est. weight:</td><td>{weightLabel(compat)}</td></tr>
            )}
            {paid.length > 0 && <tr><td>Total paid:</td><td>{paidLabel(Math.round(paidTotal * 100) / 100)}</td></tr>}
            {paid.length > 0 && paid.length < filled.length && (
              <tr><td className="sub" colSpan={2}>{filled.length - paid.length} part{filled.length - paid.length === 1 ? '' : 's'} not counted</td></tr>
            )}
          </tbody>
        </Totals>

        <p style={{ fontSize: 11, color: 'var(--win-muted)', margin: '14px 0 0' }}>
          Shared from Pedal Parts Picker. This whole page lives in the link — nothing about it is stored on a server.
        </p>
      </WindowContent>

      <ConfirmDialog
        open={confirmLoad}
        title="Replace current build?"
        message="The Builder has an unsaved bike. Opening this one will replace it."
        confirmLabel="Replace"
        onConfirm={() => { setConfirmLoad(false); openInBuilder() }}
        onCancel={() => setConfirmLoad(false)}
      />
    </PageWindow>
  )
}

/** /bike#<payload> — a public, read-only bike page decoded entirely from the URL fragment. */
export function PublicBikePage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const [decoded, setDecoded] = useState<{ hash: string; build: Build | null } | null>(null)

  useEffect(() => {
    let live = true
    decodeBikeLink(hash).then((build) => { if (live) setDecoded({ hash, build }) })
    return () => { live = false }
  }, [hash])

  if (!decoded || decoded.hash !== hash) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
  }

  if (!decoded.build) {
    return (
      <PageWindow style={{ maxWidth: 560 }}>
        <WindowHeader active><span>Bike not found</span></WindowHeader>
        <WindowContent>
          <EmptyState
            heading="This bike link didn’t work"
            subtext="It may have been cut off when it was copied — links carry the whole bike, so every character counts. Ask for the link again, or start a garage of your own."
            action={{ label: 'Start your own garage', onClick: () => navigate('/garage/import') }}
          />
        </WindowContent>
      </PageWindow>
    )
  }

  return <PublicBikeView build={decoded.build} />
}
