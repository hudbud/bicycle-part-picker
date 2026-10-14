import type { Part, PartCategory } from '@/types/parts'
import type { AdditionalItem, Build, ComponentSlot, PartCondition, PartTracking } from '@/types/build'
import { ALL_CATEGORIES, WHEEL_SUB_CATEGORIES, defaultQuantity, getCategoryLabel } from '@/data/categoryConfig'
import { MAX_PHOTOS, linkPhoto, normalizePhotoUrl } from '@/utils/bikePhotos'
import { matchPart, splitBrand, type Confidence, type ParsedLine } from '@/utils/importParts'

/**
 * The import review table's rows, and turning them into a Garage bike. Pure (no React):
 * the page keeps an array of these in state and edits them in place.
 */

export const CUSTOM = 'custom'

export interface ReviewRow {
  id: string
  /** Unticked rows are left out of the bike. */
  include: boolean
  /** What was pasted, for reference. */
  raw: string
  /** Undefined = an extra item (lights, racks, "some random bell"). */
  category?: PartCategory
  /** Catalog parts offered in the match dropdown, best first. */
  candidates: Part[]
  /** Chosen candidate id, or CUSTOM. */
  choice: string
  /** Name used when kept as custom / as an extra. */
  text: string
  confidence: Confidence
  quantity?: number
  pricePaid?: number
  condition?: PartCondition
  note?: string
  url?: string
  /** Tracking carried over from an imported bike link (source, serial…). */
  tracking?: PartTracking
}

export interface ImportMeta {
  /** "Size: 58cm", "Color: Pearl White" — go on the frame's notes. */
  frameNotes: string[]
  description?: string
  /** Image links found in the paste, in order. */
  photoUrls: string[]
}

export const CATEGORY_CHOICES: { id: PartCategory; label: string }[] = [...ALL_CATEGORIES, ...WHEEL_SUB_CATEGORIES]
  .map((c) => ({ id: c.id, label: c.label }))

export const categoryName = (c: PartCategory) => getCategoryLabel(c) ?? c

export const chosenPart = (row: ReviewRow): Part | undefined =>
  row.choice === CUSTOM ? undefined : row.candidates.find((p) => p.id === row.choice)

function fromMatch(category: PartCategory | undefined, text: string, line: ParsedLine | undefined) {
  const m = line && line.category === category ? line.match : category ? matchPart(category, text) : undefined
  if (!m) return { candidates: [] as Part[], choice: CUSTOM, confidence: 'none' as Confidence }
  // A "(custom)" part from our own export stays custom even if a catalog part looks close.
  const keepCustom = line?.custom && m.confidence !== 'high'
  return {
    candidates: m.alternatives,
    choice: m.part && !keepCustom ? m.part.id : CUSTOM,
    confidence: keepCustom ? ('none' as Confidence) : m.confidence,
  }
}

/** Rows (and bike-level bits) from a parsed paste. */
export function rowsFromParsed(lines: ParsedLine[]): { rows: ReviewRow[]; meta: ImportMeta } {
  const rows: ReviewRow[] = []
  const meta: ImportMeta = { frameNotes: [], photoUrls: [] }
  const description: string[] = []
  for (const l of lines) {
    if (l.kind === 'frameNote') meta.frameNotes.push(l.value)
    else if (l.kind === 'bikeNote') description.push(l.value)
    else if (l.kind === 'photo' && l.url) {
      const url = normalizePhotoUrl(l.url)
      if (url && !meta.photoUrls.includes(url)) meta.photoUrls.push(url)
    }
    else if (l.kind === 'part' || l.kind === 'extra') {
      const category = l.kind === 'part' ? l.category : undefined
      rows.push({
        id: l.id,
        include: true,
        raw: l.raw,
        category,
        text: l.value,
        ...fromMatch(category, l.value, l),
        quantity: l.quantity,
        pricePaid: l.pricePaid,
        condition: l.condition,
        note: l.note,
        url: l.url,
      })
    }
  }
  if (description.length) meta.description = description.join('\n\n')
  return { rows, meta }
}

/** Rows from a bike decoded from one of our links: everything already matched. */
export function rowsFromBuild(build: Build): { rows: ReviewRow[]; meta: ImportMeta } {
  const rows: ReviewRow[] = build.components
    .filter((s): s is ComponentSlot & { part: Part } => !!s.part)
    .map((s, i) => {
      const { pricePaid, condition, notes, ...rest } = s.tracking ?? {}
      return {
        id: `link.${i}`,
        include: true,
        raw: `${categoryName(s.category)}: ${s.part.brand} ${s.part.name}`,
        category: s.category,
        candidates: [s.part],
        choice: s.part.id,
        text: s.part.isCustom ? `${s.part.brand} ${s.part.name}`.trim() : s.part.name,
        confidence: 'high',
        quantity: s.quantity,
        pricePaid,
        condition,
        note: notes,
        tracking: Object.keys(rest).length ? rest : undefined,
      }
    })
  for (const [i, x] of (build.additionalItems ?? []).entries()) {
    rows.push({
      id: `link.x${i}`, include: true, raw: `Extra: ${x.name}`, candidates: [], choice: CUSTOM, text: x.name,
      confidence: 'none', pricePaid: x.price, note: x.notes, url: x.url,
    })
  }
  return { rows, meta: { frameNotes: [], description: build.description, photoUrls: (build.photos ?? []).flatMap((p) => (p.url ? [p.url] : [])) } }
}

/** Re-runs the match for a row moved to another category. */
export function recategorize(row: ReviewRow, category: PartCategory | undefined): ReviewRow {
  if (!category) return { ...row, category, candidates: [], choice: CUSTOM, confidence: 'none' }
  return { ...row, category, ...fromMatch(category, row.text, undefined) }
}

/** Puts a part picked from the catalog search at the top of the row's choices. */
export function pickPart(row: ReviewRow, part: Part): ReviewRow {
  return { ...row, candidates: [part, ...row.candidates.filter((p) => p.id !== part.id)], choice: part.id, confidence: 'high' }
}

/** A catalog-shaped part for something we couldn't match. */
export function customPart(category: PartCategory, text: string): Part {
  const { brand, name } = splitBrand(text)
  return {
    id: `custom-${crypto.randomUUID()}`,
    name: name || 'Custom part',
    brand,
    category,
    isCustom: true,
    specs: {},
    tags: ['Custom'],
  }
}

const WHEEL_PARTS = new Set<PartCategory>(WHEEL_SUB_CATEGORIES.map((c) => c.id))

/** Just sizes / gearing ("46t", "175mm") — better as a note on the slot than a second part. */
const isOnlyHints = (s: string) => !/[a-z]{3,}/i.test(s.replace(/\b\d+(?:\.\d+)?\s?(?:mm|cm|t|in)\b/gi, ''))

const joinNotes = (...bits: (string | undefined)[]) => bits.filter((b) => b?.trim()).join('; ') || undefined

export interface BikeFields { name: string }

/**
 * The bike as it'll be saved: one slot per category (the first row for it wins), every
 * part Owned. Second rows for a filled category, uncategorised rows and extras become
 * additional items; "Chainring: 46t" next to a crankset becomes a note on it.
 */
export function rowsToBuild(rows: ReviewRow[], meta: ImportMeta, fields: BikeFields): Build {
  const slots = new Map<PartCategory, ComponentSlot>()
  const extras: AdditionalItem[] = []
  const included = rows.filter((r) => r.include && (r.text.trim() || chosenPart(r)))
  const hasWheelset = included.some((r) => r.category === 'wheels')

  for (const r of included) {
    const cat = r.category
    const label = cat ? categoryName(cat) : undefined
    const existing = cat ? slots.get(cat) : undefined
    const asExtra = !cat || existing || (hasWheelset && WHEEL_PARTS.has(cat))
    if (asExtra) {
      if (existing && chosenPart(r) === undefined && isOnlyHints(r.text)) {
        existing.tracking = { ...existing.tracking, notes: joinNotes(existing.tracking?.notes, `${r.text}`) }
        continue
      }
      const p = chosenPart(r)
      const name = p ? `${p.brand} ${p.name}`.trim() : r.text.trim()
      extras.push({
        id: crypto.randomUUID(),
        name: label && !name.toLowerCase().startsWith(label.toLowerCase()) ? `${label}: ${name}` : name,
        price: r.pricePaid,
        notes: r.note,
        url: r.url,
      })
      continue
    }
    const part = chosenPart(r) ?? customPart(cat, r.text)
    const qty = r.quantity ?? defaultQuantity(cat)
    const tracking: PartTracking = { ...r.tracking }
    if (r.pricePaid != null) tracking.pricePaid = r.pricePaid
    if (r.condition) tracking.condition = r.condition
    if (r.note) tracking.notes = r.note
    slots.set(cat, {
      category: cat,
      part,
      status: 'owned',
      ...(qty !== 1 ? { quantity: qty } : {}),
      ...(Object.keys(tracking).length ? { tracking } : {}),
    })
  }

  const frame = slots.get('frame')
  if (meta.frameNotes.length && frame) {
    // "Size: 58cm" when the Frame line already said "(58cm)" replaces the bare hint.
    let notes = frame.tracking?.notes
    for (const n of meta.frameNotes) {
      const v = n.replace(/^[^:]+:\s*/, '')
      notes = notes?.split('; ').filter((b) => b !== v).join('; ') || undefined
      notes = joinNotes(notes, n)
    }
    frame.tracking = { ...frame.tracking, notes }
  }
  const description = [meta.description, frame ? undefined : meta.frameNotes.join('\n')].filter(Boolean).join('\n\n')

  const wheelsExpanded = !hasWheelset && [...slots.keys()].some((c) => WHEEL_PARTS.has(c))
  const order: PartCategory[] = ALL_CATEGORIES.flatMap((c) =>
    c.id === 'wheels' && wheelsExpanded ? WHEEL_SUB_CATEGORIES.map((w) => w.id) : [c.id],
  )
  return {
    name: fields.name.trim() || 'My bike',
    ...(description ? { description } : {}),
    components: order.map((c) => slots.get(c) ?? { category: c }),
    ...(wheelsExpanded ? { wheelsExpanded } : {}),
    additionalItems: extras,
    ...(meta.photoUrls.length ? { photos: meta.photoUrls.slice(0, MAX_PHOTOS).map((url) => linkPhoto(url)) } : {}),
    stage: 'riding',
  }
}
