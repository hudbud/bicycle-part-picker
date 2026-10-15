import type { Build } from '@/types/build'
import type { Part, PartCategory } from '@/types/parts'
import { getBuildTotals, type BuildTotals } from '@/data/pricing'
import { getPartById } from '@/data/partsDatabase'
import { computeCompat, type BuildCompat } from '@/hooks/useCompat'
import { compatLevel, weightLabel, partTitle, COMPAT_MESSAGES, type CompatLevel } from '@/components/build'
import { formatPrice } from '@/utils/format'

/**
 * Everything a guide / completed-build card or detail sidebar shows about a build,
 * computed live from the catalog. Shared by /guides and /builds.
 */
export interface BuildSummary {
  totals: BuildTotals
  /** "$4,644" or "$4,644+" when some parts have no price. */
  priceLabel: string
  compat: BuildCompat
  level: CompatLevel
  levelMessage: string
  /** "8.78 kg", "8.78 kg+" or "—". */
  weight: string
  partCount: number
  frame?: string
  groupset?: string
  wheels?: string
}

function livePart(build: Build, category: PartCategory): Part | undefined {
  const p = build.components.find((s) => s.category === category)?.part
  if (!p) return undefined
  return p.isCustom ? p : getPartById(p.id) ?? p
}

/** "Shimano GRX 1x12", "SRAM X0 Eagle AXS Transmission 1x12", "Single speed 48/18T". */
export function groupsetLabel(build: Build): string | undefined {
  const rd = livePart(build, 'rearDerailleur')
  const crank = livePart(build, 'crankset')
  const cassette = livePart(build, 'cassette')
  if (rd) {
    const model = rd.name
      .replace(/\s*Rear Derailleur/i, '')
      .replace(/\s*\((?:1x|2x|Mechanical)\)/gi, '')
      .replace(/\s+RD-[A-Z0-9-]+/i, '')
      .replace(/\s+\d+s\b/, '')
      .trim()
    const rings = crank?.attrs?.chainringCount
    const speeds = cassette?.attrs?.speeds ?? rd.attrs?.speeds
    const drive = rings && speeds ? ` ${rings}x${speeds}` : ''
    return `${rd.brand} ${model}${drive}`
  }
  const sprocket = livePart(build, 'sprocket')
  if (sprocket || crank) {
    const ring = crank?.attrs?.chainrings
    const cog = sprocket?.attrs?.smallestCogT
    return ring && cog ? `Single speed ${ring}/${cog}T` : 'Single speed'
  }
  return undefined
}

export function summarizeBuild(build: Build): BuildSummary {
  const totals = getBuildTotals(build)
  const compat = computeCompat(build)
  const level = compatLevel(build, compat)
  const frame = livePart(build, 'frame')
  const wheels = livePart(build, 'wheels')
  return {
    totals,
    priceLabel: `${formatPrice(totals.total)}${totals.missingPrices > 0 ? '+' : ''}`,
    compat,
    level,
    levelMessage: COMPAT_MESSAGES[level].replace(/ See details below\.$/, ''),
    weight: weightLabel(compat),
    partCount: build.components.filter((s) => s.part).length,
    frame: frame && partTitle(frame).replace(/\s+(Frameset|Frame)\b.*$/i, ''),
    groupset: groupsetLabel(build),
    wheels: wheels && partTitle(wheels),
  }
}

export function formatDate(iso: string | undefined, style: 'medium' | 'long' = 'medium'): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en', { dateStyle: style }).format(d)
}

/** Body/story text → paragraphs (blank-line separated; single newlines are soft wraps). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
}
