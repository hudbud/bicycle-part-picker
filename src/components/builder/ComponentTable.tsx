import { useState } from 'react'
import type { PartCategory } from '@/types/parts'
import type { Part } from '@/types/parts'
import { useBuildStore } from '@/store/buildStore'
import { getCategoriesForBikeType } from '@/data/categoryConfig'
import { ComponentRow } from './ComponentRow'
import { ComponentRowMobile } from './ComponentRowMobile'
import { AdditionalItemsSection } from './AdditionalItemsSection'
import { PartSelectionModal } from '@/components/parts/PartSelectionModal'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Table, TableBody, TableHead, TableRow, TableHeadCell, TableDataCell } from 'react95'

function TotalRow() {
  const { getTotalPrice, hasMissingPrices } = useBuildStore()
  const total = getTotalPrice()
  if (total === 0) return null
  const approx = hasMissingPrices()
  return (
    <Table style={{ width: '100%' }}>
      <TableBody>
        <TableRow style={{ background: '#d4d0c8' }}>
          <TableDataCell colSpan={2} style={{ fontSize: 12, fontWeight: 700, padding: '6px 8px' }}>
            Total
          </TableDataCell>
          <TableDataCell style={{ width: 90, textAlign: 'right', fontSize: 15, fontWeight: 700, padding: '6px 8px' }}>
            {approx ? '~' : ''}${total.toLocaleString()}
          </TableDataCell>
          <TableDataCell style={{ width: 120 }} />
          <TableDataCell style={{ width: 80 }} />
        </TableRow>
      </TableBody>
    </Table>
  )
}

const WHEEL_SUB_LABELS: Partial<Record<PartCategory, string>> = {
  frontWheel: 'Front Wheel',
  rearWheel: 'Rear Wheel',
  hub: 'Hub',
  rim: 'Rim',
  spokes: 'Spokes',
}

export function ComponentTable() {
  const { build, setPart, toggleWheelsExpanded } = useBuildStore()
  const isMobile = useIsMobile()
  const [activeCategory, setActiveCategory] = useState<PartCategory | null>(null)

  const categories = getCategoriesForBikeType(build.bikeType)

  const handleSelectPart = (part: Part) => {
    if (activeCategory) setPart(activeCategory, part)
    setActiveCategory(null)
  }

  const getLabel = (category: PartCategory) =>
    categories.find((c) => c.id === category)?.label ?? WHEEL_SUB_LABELS[category] ?? null

  const activeLabel = getLabel(activeCategory ?? 'frame') ?? ''

  if (isMobile) {
    return (
      <>
        <div>
          {build.components.map((slot) => {
            const label = getLabel(slot.category)
            if (!label) return null
            return (
              <ComponentRowMobile
                key={slot.category}
                slot={slot}
                label={label}
                onClickRow={setActiveCategory}
              />
            )
          })}
        </div>
        {activeCategory && (
          <PartSelectionModal
            open={true}
            onClose={() => setActiveCategory(null)}
            category={activeCategory}
            categoryLabel={activeLabel}
            selectedPartId={build.components.find((s) => s.category === activeCategory)?.part?.id}
            onSelect={handleSelectPart}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Table style={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            <TableHeadCell style={{ width: 140 }}>Category</TableHeadCell>
            <TableHeadCell>Part</TableHeadCell>
            <TableHeadCell style={{ width: 90, textAlign: 'right' }}>Price</TableHeadCell>
            <TableHeadCell style={{ width: 120 }}>Status</TableHeadCell>
            <TableHeadCell style={{ width: 80 }}></TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {build.components.map((slot) => {
            const label = getLabel(slot.category)
            if (!label) return null
            const isWheelSub = slot.category in WHEEL_SUB_LABELS
            return (
              <ComponentRow
                key={slot.category}
                slot={slot}
                label={label}
                onClickRow={setActiveCategory}
                isSubRow={isWheelSub}
                onToggleExpand={slot.category === 'wheels' ? toggleWheelsExpanded : undefined}
                expanded={slot.category === 'wheels' ? build.wheelsExpanded : undefined}
              />
            )
          })}
        </TableBody>
      </Table>

      <AdditionalItemsSection />

      <TotalRow />

      {activeCategory && (
        <PartSelectionModal
          open={true}
          onClose={() => setActiveCategory(null)}
          category={activeCategory}
          categoryLabel={activeLabel}
          selectedPartId={build.components.find((s) => s.category === activeCategory)?.part?.id}
          onSelect={handleSelectPart}
        />
      )}
    </>
  )
}
