import { useState } from 'react'
import type { PartCategory } from '@/types/parts'
import type { Part } from '@/types/parts'
import { useBuildStore } from '@/store/buildStore'
import { getCategoriesForBikeType } from '@/data/categoryConfig'
import { ComponentRow } from './ComponentRow'
import { ComponentRowMobile } from './ComponentRowMobile'
import { PartSelectionModal } from '@/components/parts/PartSelectionModal'
import { useIsMobile } from '@/hooks/useMediaQuery'

export function ComponentTable() {
  const { build, setPart } = useBuildStore()
  const isMobile = useIsMobile()
  const [activeCategory, setActiveCategory] = useState<PartCategory | null>(null)

  const categories = getCategoriesForBikeType(build.bikeType)

  const handleSelectPart = (part: Part) => {
    if (activeCategory) {
      setPart(activeCategory, part)
    }
    setActiveCategory(null)
  }

  const activeLabel = categories.find((c) => c.id === activeCategory)?.label ?? ''

  if (isMobile) {
    return (
      <>
        <div className="border border-border-default rounded-lg overflow-hidden">
          {build.components.map((slot) => {
            const cat = categories.find((c) => c.id === slot.category)
            if (!cat) return null
            return (
              <ComponentRowMobile
                key={slot.category}
                slot={slot}
                label={cat.label}
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
      <div className="border border-border-default rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-strong bg-bg-surface">
              <th scope="col" className="table-header px-4 py-2.5 text-left w-40">Category</th>
              <th scope="col" className="table-header px-4 py-2.5 text-left">Part</th>
              <th scope="col" className="table-header px-4 py-2.5 text-right w-24">Price</th>
              <th scope="col" className="table-header px-4 py-2.5 text-left w-32">Status</th>
              <th scope="col" className="table-header px-4 py-2.5 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {build.components.map((slot, i) => {
              const cat = categories.find((c) => c.id === slot.category)
              if (!cat) return null
              return (
                <ComponentRow
                  key={slot.category}
                  slot={slot}
                  label={cat.label}
                  onClickRow={setActiveCategory}
                  isEven={i % 2 === 0}
                />
              )
            })}
          </tbody>
        </table>
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
