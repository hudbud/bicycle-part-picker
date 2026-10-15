import { useBuildStore } from '@/store/buildStore'
import { sanitizeFilename } from '@/utils/backup'
import { computeCompat } from '@/hooks/useCompat'
import { getBuildTotals } from '@/data/pricing'
import { formatWeight } from '@/data/specSchema'
import { formatPrice } from '@/utils/format'
import { getSlotRows, partTitle, weightLabel } from '@/components/build/buildRows'
import { compatSummary } from '@/components/build/buildMarkup'
import { buildShareUrl } from '@/utils/buildCodec'

export function useBuildExport() {
  const build = useBuildStore((s) => s.build)

  const exportText = () => {
    const compat = computeCompat(build)
    const rows = getSlotRows(build, compat, true)
    const totals = getBuildTotals(build)
    const lines = [build.name, '']
    for (const row of rows) {
      const qty = row.quantity > 1 ? `${row.quantity} × ` : ''
      const where = row.offer ? ` @ ${row.offer.merchant.name}` : ''
      const weight = row.weightG != null ? `, ${formatWeight(row.weightG)}` : ''
      lines.push(`${row.label.padEnd(18)} ${qty}${partTitle(row.part!)}${row.isCustom ? ' (custom)' : ''} (${formatPrice(row.price)}${where}${weight})`)
    }
    if (build.additionalItems && build.additionalItems.length > 0) {
      lines.push('')
      lines.push('Extras & Accessories')
      for (const item of build.additionalItems) {
        lines.push(`${item.name.padEnd(18)} (${formatPrice(item.price)})${item.notes ? ` — ${item.notes}` : ''}`)
      }
    }
    lines.push('')
    lines.push(`Total: ${totals.missingPrices ? '~' : ''}${formatPrice(totals.total)}`)
    lines.push(`Estimated Weight: ${weightLabel(compat)}`)
    lines.push(`Compatibility: ${compatSummary(build, compat)}`)
    for (const issue of [...compat.errors, ...compat.warnings, ...compat.notes]) {
      lines.push(`  [${issue.severity}] ${issue.message}`)
    }
    lines.push('')
    lines.push(`Permalink: ${buildShareUrl(build)}`)
    return lines.join('\n')
  }

  const csvCell = (value: string) => `"${value.split('"').join('""')}"`

  const exportCsv = () => {
    const rows = [['Category', 'Brand', 'Part', 'Quantity', 'Unit Price', 'Price', 'Where', 'Weight (g)', 'Status / Notes']]
    for (const row of getSlotRows(build, undefined, true)) {
      const part = row.part!
      rows.push([
        row.label,
        part.brand,
        part.name,
        String(row.quantity),
        row.unitPrice?.toString() ?? '',
        row.price?.toString() ?? '',
        row.offer?.merchant.name ?? (row.isCustom ? 'custom' : ''),
        row.weightG?.toString() ?? '',
        row.slot.status ?? '',
      ])
    }
    for (const item of build.additionalItems ?? []) {
      rows.push(['Extra', '', item.name, '1', item.price?.toString() ?? '', item.price?.toString() ?? '', '', '', item.notes ?? ''])
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
