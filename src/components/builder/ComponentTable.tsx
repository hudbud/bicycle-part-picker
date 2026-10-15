import { Fragment, useMemo, useState } from 'react'
import type { Part, PartCategory } from '@/types/parts'
import { useBuildStore } from '@/store/buildStore'
import { useCompat } from '@/hooks/useCompat'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { PartSelectionModal } from '@/components/parts/PartSelectionModal'
import { BuildIssues } from '@/components/build/BuildIssues'
import { BuildTotals } from '@/components/build/BuildTotals'
import { getSlotRow, isWheelSubCategory, slotLabel } from '@/components/build/buildRows'
import { TextButton, RouterAnchor } from '@/components/build/BuildCells'
import { productsPath } from '@/data/categoryConfig'
import { hiddenCategories } from '@/data/buildTemplates'
import { Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell, Button } from 'react95'
import { ComponentRow, COLS } from './ComponentRow'
import { ComponentRowMobile } from './ComponentRowMobile'
import { PartTrackingDialog } from '@/components/tracking/PartTrackingDialog'
import type { BikeRef } from '@/store/bikeSync'
import { AdditionalItemsRows, AdditionalItemsSection } from './AdditionalItemsSection'

const num = { textAlign: 'right' as const }
const CURRENT: BikeRef = { kind: 'current' }

/** Header row standing in for "Wheelset" while the wheels are split into parts. */
function SplitWheelsHeader({ onCollapse }: { onCollapse: () => void }) {
  return (
    <TableRow style={{ background: 'var(--win-stripe)' }}>
      <TableDataCell style={{ fontSize: 12 }}>
        <RouterAnchor to={productsPath('wheels')}>Wheelset</RouterAnchor>
      </TableDataCell>
      <td colSpan={6} style={{ fontSize: 11, fontStyle: 'italic', padding: '0 8px', color: 'var(--win-window-text)' }}>
        Split into front/rear wheels, hubs, rims &amp; spokes.{' '}
        <TextButton onClick={onCollapse} style={{ fontStyle: 'normal' }}>Join back into one Wheelset</TextButton>
      </td>
      <TableDataCell style={{ textAlign: 'right' }}>
        <Button
          variant="flat"
          square
          size="sm"
          onClick={onCollapse}
          style={{ fontSize: 10 }}
          title="Collapse into a single Wheelset row (clears the split rows)"
          aria-label="Collapse into a single Wheelset row"
        >
          ▲
        </Button>
      </TableDataCell>
    </TableRow>
  )
}

export function ComponentTable() {
  const build = useBuildStore((s) => s.build)
  const setPart = useBuildStore((s) => s.setPart)
  const toggleWheelsExpanded = useBuildStore((s) => s.toggleWheelsExpanded)
  const hideRow = useBuildStore((s) => s.hideRow)
  const compat = useCompat()
  const isMobile = useIsMobile()
  const [activeCategory, setActiveCategory] = useState<PartCategory | null>(null)
  const [detailsCategory, setDetailsCategory] = useState<PartCategory | null>(null)

  const rows = useMemo(() => {
    const hidden = new Set(hiddenCategories(build))
    return build.components.filter((s) => !hidden.has(s.category)).map((s) => getSlotRow(s, compat))
  }, [build, compat])
  const firstSubIndex = rows.findIndex((r) => isWheelSubCategory(r.category))
  const activeSlot = build.components.find((s) => s.category === activeCategory)

  const handleSelectPart = (part: Part) => {
    if (activeCategory) setPart(activeCategory, part)
    setActiveCategory(null)
  }

  const modal = activeCategory && (
    <PartSelectionModal
      open
      onClose={() => setActiveCategory(null)}
      category={activeCategory}
      categoryLabel={slotLabel(activeCategory)}
      selectedPart={activeSlot?.part}
      onSelect={handleSelectPart}
    />
  )

  const dialog = <PartTrackingDialog bike={CURRENT} category={detailsCategory} onClose={() => setDetailsCategory(null)} />

  // Wheel sub-rows come and go with the split, so only whole rows can be hidden.
  const onHide = (row: (typeof rows)[number]) => (row.part || row.isWheelSub ? undefined : () => hideRow(row.category))

  const footer = (
    <>
      <div style={{ marginTop: 8 }}><BuildTotals build={build} mode="tracking" /></div>
      <BuildIssues compat={compat} />
    </>
  )

  if (isMobile) {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rows.map((row, i) => (
            <Fragment key={row.category}>
              {build.wheelsExpanded && i === firstSubIndex && (
                <ComponentRowMobile
                  row={getSlotRow({ category: 'wheels' })}
                  onCustom={setActiveCategory}
                  onDetails={setDetailsCategory}
                  onToggleExpand={toggleWheelsExpanded}
                  expanded
                />
              )}
              <ComponentRowMobile
                row={row}
                onCustom={setActiveCategory}
                onDetails={setDetailsCategory}
                onToggleExpand={row.category === 'wheels' ? toggleWheelsExpanded : undefined}
                onHide={onHide(row)}
              />
            </Fragment>
          ))}
        </div>
        <div style={{ marginTop: 8 }}><AdditionalItemsSection /></div>
        {footer}
        {modal}
        {dialog}
      </>
    )
  }

  return (
    <>
      <Table style={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            <TableHeadCell style={{ width: COLS.component }}>Component</TableHeadCell>
            <TableHeadCell>Selection</TableHeadCell>
            <TableHeadCell style={{ width: COLS.status }}>Status</TableHeadCell>
            <TableHeadCell style={{ width: COLS.paid, ...num }} title="What you actually paid">Paid</TableHeadCell>
            <TableHeadCell style={{ width: COLS.condition, whiteSpace: 'nowrap' }} title="Condition / Source">Cond. / Source</TableHeadCell>
            <TableHeadCell style={{ width: COLS.weight, ...num }}>Weight</TableHeadCell>
            <TableHeadCell style={{ width: COLS.market, fontSize: 12, color: 'var(--win-muted)' }} title="Today's best simulated price and where (used-market for discontinued parts)">Market</TableHeadCell>
            <TableHeadCell style={{ width: COLS.actions }}></TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <Fragment key={row.category}>
              {build.wheelsExpanded && i === firstSubIndex && <SplitWheelsHeader onCollapse={toggleWheelsExpanded} />}
              <ComponentRow
                row={row}
                onCustom={setActiveCategory}
                onDetails={setDetailsCategory}
                onToggleExpand={row.category === 'wheels' ? toggleWheelsExpanded : undefined}
                onHide={onHide(row)}
              />
            </Fragment>
          ))}
          <AdditionalItemsRows />
        </TableBody>
      </Table>
      {footer}
      {modal}
      {dialog}
    </>
  )
}
