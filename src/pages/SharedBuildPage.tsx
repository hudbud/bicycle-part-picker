import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useMemo } from 'react'
import type { Build } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import { useGarageStore } from '@/store/garageStore'
import { BikeTypePill } from '@/components/ui/BikeTypePill'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getCategoriesForBikeType } from '@/data/categoryConfig'
import { EmptyState } from '@/components/ui/EmptyState'
import { Window, WindowHeader, WindowContent, Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell, Button, Toolbar } from 'react95'
import styled from 'styled-components'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`

const BuildPhoto = styled.img`
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  display: block;
  border-bottom: 2px solid #888;
`

const WHEEL_SUB_LABELS: Partial<Record<PartCategory, string>> = {
  frontWheel: 'Front Wheel',
  rearWheel: 'Rear Wheel',
  hub: 'Hub',
  rim: 'Rim',
  spokes: 'Spokes',
}

function SharedBuildView({ build }: { build: Build }) {
  const categories = getCategoriesForBikeType(build.bikeType)
  const partsTotal = build.components.reduce((s, c) => s + (c.part?.price ?? 0), 0)
  const extrasTotal = (build.additionalItems ?? []).reduce((s, i) => s + (i.price ?? 0), 0)
  const total = partsTotal + extrasTotal

  const createdAt = build.createdAt
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(build.createdAt))
    : null

  const getLabel = (category: PartCategory) =>
    categories.find((c) => c.id === category)?.label ?? WHEEL_SUB_LABELS[category] ?? null

  return (
    <PageWindow>
      <WindowHeader active>
        <span>Shared Build — {build.name}</span>
      </WindowHeader>
      <Toolbar style={{ gap: 8, flexWrap: 'wrap' }}>
        <BikeTypePill type={build.bikeType} />
        {build.ownerName && <span style={{ fontSize: 12 }}>by {build.ownerName}</span>}
        {createdAt && <span style={{ fontSize: 12 }}>{createdAt}</span>}
        <span style={{ fontSize: 11, border: '1px solid #888', padding: '1px 6px' }}>Shared Build</span>
      </Toolbar>

      {build.photo && <BuildPhoto src={build.photo} alt={`${build.name} photo`} />}

      <WindowContent>
        {build.description && (
          <p style={{ fontSize: 13, marginBottom: 12 }}>{build.description}</p>
        )}

        <Table style={{ width: '100%', marginBottom: 12 }}>
          <TableHead>
            <TableRow>
              <TableHeadCell style={{ width: 140 }}>Category</TableHeadCell>
              <TableHeadCell>Part</TableHeadCell>
              <TableHeadCell style={{ width: 90, textAlign: 'right' }}>Price</TableHeadCell>
              <TableHeadCell style={{ width: 120 }}>Status</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {build.components.map((slot) => {
              const label = getLabel(slot.category)
              if (!label) return null
              const isWheelSub = slot.category in WHEEL_SUB_LABELS
              return (
                <TableRow key={slot.category}>
                  <TableDataCell style={{ fontSize: 12, fontWeight: 500, paddingLeft: isWheelSub ? 20 : undefined }}>
                    {isWheelSub && <span style={{ marginRight: 4, opacity: 0.5 }}>└</span>}
                    {label}
                  </TableDataCell>
                  <TableDataCell style={{ fontSize: 13 }}>
                    {slot.part ? `${slot.part.brand} ${slot.part.name}` : '—'}
                  </TableDataCell>
                  <TableDataCell style={{ textAlign: 'right', fontSize: 13, fontWeight: 700 }}>
                    {slot.part?.price ? `$${slot.part.price.toLocaleString()}` : '—'}
                  </TableDataCell>
                  <TableDataCell>
                    {slot.status && <StatusBadge status={slot.status} />}
                  </TableDataCell>
                </TableRow>
              )
            })}

            {(build.additionalItems ?? []).length > 0 && (
              <>
                <TableRow style={{ background: '#d4d0c8' }}>
                  <td colSpan={4} style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px' }}>
                    Extras &amp; Accessories
                  </td>
                </TableRow>
                {build.additionalItems!.map((item) => (
                  <TableRow key={item.id}>
                    <TableDataCell style={{ fontSize: 12, paddingLeft: 16 }}>
                      <span style={{ marginRight: 4, opacity: 0.4 }}>·</span>
                      {item.name}
                      {item.notes && <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 8 }}>{item.notes}</span>}
                    </TableDataCell>
                    <TableDataCell />
                    <TableDataCell style={{ textAlign: 'right', fontSize: 13, fontWeight: 700 }}>
                      {item.price ? `$${item.price.toLocaleString()}` : '—'}
                    </TableDataCell>
                    <TableDataCell />
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>

        {total > 0 && (
          <div style={{ textAlign: 'right', marginBottom: 12 }}>
            <span style={{ fontSize: 12, marginRight: 8 }}>Total:</span>
            <strong style={{ fontSize: 18 }}>${total.toLocaleString()}</strong>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #888', paddingTop: 12 }}>
          <Link to="/build" style={{ textDecoration: 'none' }}>
            <Button variant="flat">Build something like this →</Button>
          </Link>
          <Button variant="flat" onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy link</Button>
        </div>
      </WindowContent>
    </PageWindow>
  )
}

export function SharedBuildPage() {
  const { buildId } = useParams()
  const [searchParams] = useSearchParams()
  const { getBuildById } = useGarageStore()

  const build = useMemo<Build | null>(() => {
    if (buildId && buildId !== 'shared') return getBuildById(buildId) ?? null
    const b = searchParams.get('b')
    if (b) {
      try { return JSON.parse(decodeURIComponent(atob(b))) as Build } catch { return null }
    }
    return null
  }, [buildId, searchParams, getBuildById])

  if (!build) {
    return (
      <PageWindow>
        <WindowHeader active><span>Build Not Found</span></WindowHeader>
        <WindowContent>
          <EmptyState
            heading="Build not found"
            subtext="This build doesn't exist or has been made private."
            action={{ label: 'Start your own build', onClick: () => window.location.assign('/build') }}
          />
        </WindowContent>
      </PageWindow>
    )
  }

  return <SharedBuildView build={build} />
}
