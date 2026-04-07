import { useBuildStore } from '@/store/buildStore'

export function useBuildExport() {
  const { build, getTotalPrice } = useBuildStore()

  const exportText = () => {
    const lines = [`${build.name} — ${build.bikeType.toUpperCase()}`, '']
    for (const slot of build.components) {
      if (slot.part) {
        const price = slot.part.price ? `$${slot.part.price.toLocaleString()}` : '—'
        lines.push(`${slot.category.padEnd(18)} ${slot.part.brand} ${slot.part.name} (${price})`)
      }
    }
    lines.push('')
    lines.push(`Total: $${getTotalPrice().toLocaleString()}`)
    return lines.join('\n')
  }

  const exportCsv = () => {
    const rows = [['Category', 'Brand', 'Part', 'Price', 'Status']]
    for (const slot of build.components) {
      if (slot.part) {
        rows.push([
          slot.category,
          slot.part.brand,
          slot.part.name,
          slot.part.price?.toString() ?? '',
          slot.status ?? '',
        ])
      }
    }
    return rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
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

  return {
    downloadText: () => download(exportText(), `${build.name}.txt`, 'text/plain'),
    downloadCsv: () => download(exportCsv(), `${build.name}.csv`, 'text/csv'),
    downloadJson: () => download(exportJson(), `${build.name}.json`, 'application/json'),
  }
}
