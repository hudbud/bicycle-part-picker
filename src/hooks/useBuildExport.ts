import { useBuildStore } from '@/store/buildStore'
import { getCategoriesForBikeType } from '@/data/categoryConfig'
import { sanitizeFilename } from '@/utils/backup'
import type { PartCategory } from '@/types/parts'

const WHEEL_SUB_LABELS: Partial<Record<PartCategory, string>> = {
  frontWheel: 'Front Wheel',
  rearWheel: 'Rear Wheel',
  hub: 'Hub',
  rim: 'Rim',
  spokes: 'Spokes',
}

export function useBuildExport() {
  const { build, getTotalPrice } = useBuildStore()

  const getLabel = (category: PartCategory) =>
    getCategoriesForBikeType(build.bikeType).find((c) => c.id === category)?.label
      ?? WHEEL_SUB_LABELS[category]
      ?? category

  const exportText = () => {
    const lines = [`${build.name} — ${build.bikeType.toUpperCase()}`, '']
    for (const slot of build.components) {
      if (slot.part) {
        const price = slot.part.price ? `$${slot.part.price.toLocaleString()}` : '—'
        lines.push(`${getLabel(slot.category).padEnd(18)} ${slot.part.brand} ${slot.part.name} (${price})`)
      }
    }
    if (build.additionalItems && build.additionalItems.length > 0) {
      lines.push('')
      lines.push('Extras & Accessories')
      for (const item of build.additionalItems) {
        const price = item.price ? `$${item.price.toLocaleString()}` : '—'
        lines.push(`${item.name.padEnd(18)} (${price})${item.notes ? ` — ${item.notes}` : ''}`)
      }
    }
    lines.push('')
    lines.push(`Total: $${getTotalPrice().toLocaleString()}`)
    return lines.join('\n')
  }

  const csvCell = (value: string) => `"${value.split('"').join('""')}"`

  const exportCsv = () => {
    const rows = [['Category', 'Brand', 'Part', 'Price', 'Status']]
    for (const slot of build.components) {
      if (slot.part) {
        rows.push([
          getLabel(slot.category),
          slot.part.brand,
          slot.part.name,
          slot.part.price?.toString() ?? '',
          slot.status ?? '',
        ])
      }
    }
    for (const item of build.additionalItems ?? []) {
      rows.push([item.name, '', '', item.price?.toString() ?? '', item.notes ?? ''])
    }
    return rows.map((r) => r.map(csvCell).join(',')).join('\n')
  }

  const exportJson = () => JSON.stringify(build, null, 2)

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const filename = sanitizeFilename(build.name)

  return {
    downloadText: () => download(exportText(), `${filename}.txt`, 'text/plain'),
    downloadCsv: () => download(exportCsv(), `${filename}.csv`, 'text/csv'),
    downloadJson: () => download(exportJson(), `${filename}.json`, 'application/json'),
  }
}
