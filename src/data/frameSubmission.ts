import type {
  BottomBracketShell, BrakeMount, HeadsetStandard, Material, Part, PartAttrs, RearAxle,
  Steerer, Suspension, WheelSize,
} from '@/types/parts'
import { WHEEL_SIZE_LABELS } from '@/data/specSchema'

/**
 * Community frame submissions. The "Add a frame" page turns a FrameDraft into a catalog-shaped
 * Part and opens a GitHub issue holding it as a ```json block; the issue bot checks it with
 * scripts/import-submission.mjs --check and a maintainer imports it with the same script.
 * The required fields here mirror REQUIRED.frame in scripts/catalog-rules.mjs.
 */

export const SUBMISSION_REPO = 'hudbud/bicycle-part-picker'
const MAX_YEAR = 2026

type Opt<T> = { value: T; label: string }

export const MATERIALS = [
  { value: 'steel', label: 'Steel' },
  { value: 'aluminum', label: 'Aluminum' },
  { value: 'carbon', label: 'Carbon' },
  { value: 'titanium', label: 'Titanium' },
] satisfies Opt<Material>[]

export const WHEEL_SIZES = ([622, 584, 559, 507, 406] as const).map((v) => ({ value: v, label: WHEEL_SIZE_LABELS[v] })) satisfies Opt<WheelSize>[]

export const SUSPENSIONS = [
  { value: 'Rigid', label: 'Rigid' },
  { value: 'Hardtail', label: 'Hardtail (suspension fork)' },
  { value: 'Full Suspension', label: 'Full suspension' },
] satisfies Opt<Suspension>[]

export const BB_SHELLS = [
  { value: 'BSA 68/73mm', label: 'Threaded BSA (68/73mm)' },
  { value: 'T47', label: 'T47' },
  { value: 'Italian', label: 'Italian threaded' },
  { value: 'BB86/BB92', label: 'BB86 / BB92 press-fit' },
  { value: 'PF30', label: 'PF30' },
  { value: 'BB30', label: 'BB30' },
  { value: 'BB386EVO', label: 'BB386EVO' },
  { value: 'BMX Mid', label: 'BMX Mid' },
  { value: 'BMX Spanish', label: 'BMX Spanish' },
] satisfies Opt<BottomBracketShell>[]

export const REAR_AXLES = [
  { value: '12x142mm', label: '12×142mm thru-axle' },
  { value: '12x148mm Boost', label: '12×148mm Boost' },
  { value: '12x157mm SuperBoost', label: '12×157mm SuperBoost' },
  { value: 'QR 135mm', label: '135mm QR' },
  { value: 'QR 130mm', label: '130mm QR' },
  { value: 'QR 126mm', label: '126mm QR' },
  { value: '120mm Track', label: '120mm track (nutted)' },
  { value: '110mm BMX', label: '110mm BMX' },
] satisfies Opt<RearAxle>[]

export const BRAKE_MOUNTS = [
  { value: 'Flat Mount', label: 'Flat mount disc' },
  { value: 'Post Mount', label: 'Post mount disc' },
  { value: 'IS Disc', label: 'IS disc tabs' },
  { value: 'Rim Caliper', label: 'Rim caliper (drilled bridge)' },
  { value: 'V-Brake/Cantilever', label: 'Canti / V-brake bosses' },
  { value: 'U-Brake', label: 'U-brake / roller-cam' },
  { value: 'None', label: 'None (brakeless track)' },
] satisfies Opt<BrakeMount>[]

export const HEADSETS = [
  { value: 'ZS44/ZS56', label: 'ZS44 / ZS56 (tapered)' },
  { value: 'IS42/IS52', label: 'IS42 / IS52 (tapered, integrated)' },
  { value: 'ZS44/EC44', label: 'ZS44 / EC44' },
  { value: 'ZS44/EC56', label: 'ZS44 / EC56' },
  { value: 'EC34/EC44', label: 'EC34 / EC44' },
  { value: 'EC34/EC34', label: 'EC34 / EC34 (1-1/8" external)' },
  { value: 'IS41/IS52', label: 'IS41 / IS52' },
  { value: 'EC30/EC30', label: 'EC30 / EC30 (1" threaded)' },
  { value: 'Integrated 45x45', label: 'Integrated 45×45' },
  { value: 'Proprietary', label: 'Proprietary' },
] satisfies Opt<HeadsetStandard>[]

export const STEERERS = [
  { value: 'Tapered 1-1/8" to 1.5"', label: 'Tapered 1-1/8" → 1.5"' },
  { value: 'Straight 1-1/8"', label: 'Straight 1-1/8" threadless' },
  { value: 'Threaded 1-1/8"', label: 'Threaded 1-1/8"' },
  { value: 'Straight 1"', label: 'Straight 1" threadless' },
  { value: 'Threaded 1"', label: 'Threaded 1" (quill)' },
] satisfies Opt<Steerer>[]

export const FD_MOUNTS = [
  { value: 'None', label: 'None (1×)' },
  { value: 'Braze-on', label: 'Braze-on' },
  { value: 'Clamp', label: 'Clamp' },
  { value: 'Direct Mount', label: 'Direct mount' },
] satisfies Opt<NonNullable<PartAttrs['frontDerailleurMount']>>[]

export const SHOCK_MOUNTS = [
  { value: 'Standard', label: 'Standard eyelet' },
  { value: 'Trunnion', label: 'Trunnion' },
] satisfies Opt<NonNullable<PartAttrs['shockMount']>>[]

/** Yes/No fields are '' until answered so nothing gets submitted by default. */
export type YesNo = '' | 'yes' | 'no'

/** The form's state: strings as typed, parsed by draftToPart. */
export interface FrameDraft {
  brand: string
  model: string
  year: string
  discontinued: boolean
  material: Material | ''
  price: string
  weightG: string
  weightEstimated: boolean
  url: string
  tubing: string
  wheelSizes: WheelSize[]
  maxTireMm: string
  suspension: Suspension | ''
  travelMm: string
  shockSize: string
  shockMount: PartAttrs['shockMount'] | ''
  maxForkTravelMm: string
  bbShell: BottomBracketShell | ''
  rearAxle: RearAxle | ''
  brakeMount: BrakeMount | ''
  maxRotorMm: string
  headsetStd: HeadsetStandard | ''
  steerer: Steerer | ''
  seatpostMm: string
  derailleurHanger: YesNo
  udh: YesNo
  frontDerailleurMount: PartAttrs['frontDerailleurMount'] | ''
  downtubeBosses: YesNo
  notes: string
  submittedBy: string
}

export const EMPTY_DRAFT: FrameDraft = {
  brand: '', model: '', year: '', discontinued: false, material: '', price: '', weightG: '', weightEstimated: false,
  url: '', tubing: '', wheelSizes: [], maxTireMm: '', suspension: '', travelMm: '', shockSize: '',
  shockMount: '', maxForkTravelMm: '', bbShell: '', rearAxle: '', brakeMount: '', maxRotorMm: '', headsetStd: '',
  steerer: '', seatpostMm: '', derailleurHanger: '', udh: '', frontDerailleurMount: '', downtubeBosses: '',
  notes: '', submittedBy: '',
}

const num = (s: string): number | undefined => {
  if (s.trim() === '') return undefined
  const n = Number(s.replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? n : undefined
}
const yesNo = (v: YesNo): boolean | undefined => (v === '' ? undefined : v === 'yes')
const fromBool = (b: boolean | undefined): YesNo => (b === undefined ? '' : b ? 'yes' : 'no')
const str = (n: number | undefined) => (n === undefined ? '' : String(n))

export const isDisc = (m: FrameDraft['brakeMount']) => m === 'Flat Mount' || m === 'Post Mount' || m === 'IS Disc'
export const isFull = (d: FrameDraft) => d.suspension === 'Full Suspension'
/** Pre-2005 frames are used-market only, like the vintage catalog. */
export const isVintageYear = (d: FrameDraft) => (num(d.year) ?? MAX_YEAR) < 2005

export function slugify(s: string): string {
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Brand + model with punctuation and "frame(set)" dropped, to catch the same frame under another id (as the importer does). */
export function frameNameKey(brand: string, name: string): string {
  return slugify(`${brand} ${name}`).replace(/-(frame|frameset)(?=-|$)/g, '').replace(/-/g, '')
}

/** The id import-submission.mjs gives a new frame (keep in sync). */
export function draftId(d: FrameDraft): string {
  const discontinued = d.discontinued || isVintageYear(d)
  const year = discontinued && Number.isInteger(num(d.year)) ? `-${num(d.year)}` : ''
  return slugify(`${d.brand} ${d.model}`).replace(/-frame(set)?$/, '') + year
}

const MATERIAL_TAG: Record<Material, string> = { steel: 'Steel', aluminum: 'Aluminum', carbon: 'Carbon', titanium: 'Titanium' }

/** Catalog-shaped frame (attrs only where answered). The id is a placeholder; the importer sets it. */
export function draftToPart(d: FrameDraft): Part {
  const full = isFull(d)
  const discontinued = d.discontinued || isVintageYear(d)
  const attrs: PartAttrs = {
    material: d.material || undefined,
    wheelSizes: d.wheelSizes.length ? [...d.wheelSizes].sort((a, b) => b - a) : undefined,
    maxTireMm: num(d.maxTireMm),
    suspension: d.suspension || undefined,
    travelMm: full ? num(d.travelMm) : undefined,
    shockSize: full ? d.shockSize.trim() || undefined : undefined,
    shockMount: full ? d.shockMount || undefined : undefined,
    maxForkTravelMm: d.suspension === 'Rigid' && d.maxForkTravelMm === '' ? 0 : num(d.maxForkTravelMm),
    bbShell: d.bbShell || undefined,
    rearAxle: d.rearAxle || undefined,
    brakeMount: d.brakeMount || undefined,
    maxRotorMm: isDisc(d.brakeMount) ? num(d.maxRotorMm) : undefined,
    headsetStd: d.headsetStd || undefined,
    steerer: d.steerer || undefined,
    seatpostMm: num(d.seatpostMm),
    derailleurHanger: yesNo(d.derailleurHanger),
    udh: yesNo(d.udh),
    frontDerailleurMount: d.frontDerailleurMount || undefined,
    downtubeBosses: yesNo(d.downtubeBosses),
  }
  for (const k of Object.keys(attrs) as (keyof PartAttrs)[]) if (attrs[k] === undefined) delete attrs[k]

  const weight = num(d.weightG)
  const specs: Part['specs'] = {}
  if (d.tubing.trim()) specs.Tubing = d.tubing.trim()
  if (weight) specs['Frame Weight'] = `${Math.round(weight)} g${d.weightEstimated ? ' (est.)' : ''}`
  if (d.notes.trim()) specs.Notes = d.notes.trim()
  const by = d.submittedBy.trim().replace(/^\/?u\//, '')
  if (by) specs['Submitted by'] = `u/${by}`

  const tags = [
    ...(d.material ? [MATERIAL_TAG[d.material]] : []),
    ...(d.suspension === 'Hardtail' ? ['Hardtail'] : full ? ['Full Suspension'] : []),
    ...(discontinued ? ['Vintage'] : []),
  ]

  return {
    id: draftId(d),
    name: d.model.trim(),
    brand: d.brand.trim(),
    category: 'frame',
    price: num(d.price),
    weightG: weight === undefined ? undefined : Math.round(weight),
    year: num(d.year),
    ...(discontinued ? { discontinued: true } : {}),
    ...(d.url.trim() ? { url: d.url.trim() } : {}),
    attrs,
    specs,
    tags: [...new Set(tags)],
  }
}

/** Prefill from a catalog frame (corrections) or a custom part. */
export function partToDraft(p: Part): FrameDraft {
  const a = p.attrs ?? {}
  const weightSpec = String(p.specs['Frame Weight'] ?? p.specs.Weight ?? '')
  return {
    ...EMPTY_DRAFT,
    brand: p.brand,
    model: p.name,
    year: str(p.year),
    discontinued: !!p.discontinued,
    material: a.material ?? '',
    price: str(p.price),
    weightG: str(p.weightG),
    weightEstimated: /est/i.test(weightSpec),
    url: p.url ?? '',
    tubing: typeof p.specs.Tubing === 'string' ? p.specs.Tubing : '',
    wheelSizes: a.wheelSizes ?? [],
    maxTireMm: str(a.maxTireMm),
    suspension: a.suspension ?? '',
    travelMm: str(a.travelMm),
    shockSize: a.shockSize ?? '',
    shockMount: a.shockMount ?? '',
    maxForkTravelMm: str(a.maxForkTravelMm),
    bbShell: a.bbShell ?? '',
    rearAxle: a.rearAxle ?? '',
    brakeMount: a.brakeMount ?? '',
    maxRotorMm: str(a.maxRotorMm),
    headsetStd: a.headsetStd ?? '',
    steerer: a.steerer ?? '',
    seatpostMm: str(a.seatpostMm),
    derailleurHanger: fromBool(a.derailleurHanger),
    udh: fromBool(a.udh),
    frontDerailleurMount: a.frontDerailleurMount ?? '',
    downtubeBosses: fromBool(a.downtubeBosses),
    notes: typeof p.specs.Notes === 'string' ? p.specs.Notes : '',
  }
}

export type DraftField = keyof FrameDraft

/** What's still missing or wrong before it can go to the catalog, by field. */
export function draftProblems(d: FrameDraft): Partial<Record<DraftField, string>> {
  const out: Partial<Record<DraftField, string>> = {}
  const need = (k: DraftField, ok: boolean, msg = 'Required') => { if (!ok) out[k] = msg }
  const pos = (k: DraftField, max: number) => {
    const n = num(d[k] as string)
    need(k, n !== undefined && n > 0 && n <= max, n === undefined ? 'Required' : `Enter a number up to ${max}`)
  }
  need('brand', !!d.brand.trim())
  need('model', !!d.model.trim())
  const year = num(d.year)
  need('year', year !== undefined && Number.isInteger(year) && year >= 1975 && year <= MAX_YEAR, year === undefined ? 'Required' : `1975–${MAX_YEAR}`)
  need('material', !!d.material)
  pos('price', 50000)
  pos('weightG', 10000)
  if (d.url.trim()) need('url', /^https:\/\/\S+\.\S+/.test(d.url.trim()), 'Use an https:// link')
  need('wheelSizes', d.wheelSizes.length > 0, 'Pick at least one')
  pos('maxTireMm', 130)
  need('suspension', !!d.suspension)
  if (isFull(d)) {
    pos('travelMm', 250)
    need('shockSize', /^\d{3}\s*x\s*\d{2}(\.\d)?$/i.test(d.shockSize.trim()), d.shockSize.trim() ? 'Eye-to-eye × stroke, e.g. 210x55' : 'Required')
    need('shockMount', !!d.shockMount)
  }
  if (d.suspension !== 'Rigid' || d.maxForkTravelMm !== '') {
    const n = num(d.maxForkTravelMm)
    need('maxForkTravelMm', n !== undefined && n >= 0 && n <= 220, n === undefined ? 'Required (0 for rigid-only)' : '0–220')
  }
  need('bbShell', !!d.bbShell)
  need('rearAxle', !!d.rearAxle)
  need('brakeMount', !!d.brakeMount)
  if (isDisc(d.brakeMount) && d.maxRotorMm) pos('maxRotorMm', 230)
  need('headsetStd', !!d.headsetStd)
  need('steerer', !!d.steerer)
  const post = num(d.seatpostMm)
  need('seatpostMm', post !== undefined && post >= 21 && post <= 35, post === undefined ? 'Required' : 'Seat tube ID, e.g. 27.2')
  need('derailleurHanger', d.derailleurHanger !== '')
  need('udh', d.udh !== '')
  need('frontDerailleurMount', !!d.frontDerailleurMount)
  return out
}

/** Enough to save it as a custom part for your own build (compat checks use whatever's filled in). */
export const canUseOnBike = (d: FrameDraft) => !!d.brand.trim() && !!d.model.trim()

export interface Submission {
  kind: 'frame'
  version: 1
  editOf?: string
  part: Part
}

export function submissionTitle(part: Part, editOf?: string): string {
  return `[Frame] ${editOf ? 'Correction: ' : ''}${part.brand} ${part.name}`.slice(0, 120)
}

const mm = (n: number | undefined) => (n === undefined ? undefined : `${n}mm`)

/** Summary rows for reviewers: [label, display value, field it comes from]. */
function summaryRows(p: Part): [string, string | undefined, string][] {
  const a = p.attrs ?? {}
  const yn = (b: boolean | undefined) => (b === undefined ? undefined : b ? 'Yes' : 'No')
  return [
    ['Year', p.year === undefined ? undefined : String(p.year), 'year'],
    ['Price', p.price === undefined ? undefined : `$${p.price}${p.discontinued ? ' (used value)' : ''}`, 'price'],
    ['Weight', p.weightG === undefined ? undefined : `${p.weightG} g`, 'weightG'],
    ['Material', a.material, 'material'],
    ['Wheels', a.wheelSizes?.map((w) => WHEEL_SIZE_LABELS[w]).join(', '), 'wheelSizes'],
    ['Max tire', mm(a.maxTireMm), 'maxTireMm'],
    ['Suspension', a.suspension, 'suspension'],
    ['Rear travel', mm(a.travelMm), 'travelMm'],
    ['Shock', a.shockSize && `${a.shockSize} ${a.shockMount ?? ''}`.trim(), 'shockSize'],
    ['Max fork travel', mm(a.maxForkTravelMm), 'maxForkTravelMm'],
    ['BB shell', a.bbShell, 'bbShell'],
    ['Rear axle', a.rearAxle, 'rearAxle'],
    ['Brakes', a.brakeMount, 'brakeMount'],
    ['Max rotor', mm(a.maxRotorMm), 'maxRotorMm'],
    ['Headset', a.headsetStd, 'headsetStd'],
    ['Steerer', a.steerer, 'steerer'],
    ['Seatpost', mm(a.seatpostMm), 'seatpostMm'],
    ['Derailleur hanger', yn(a.derailleurHanger), 'derailleurHanger'],
    ['UDH', yn(a.udh), 'udh'],
    ['Front derailleur', a.frontDerailleurMount, 'frontDerailleurMount'],
    ['Downtube bosses', yn(a.downtubeBosses), 'downtubeBosses'],
    ['Link', p.url, 'url'],
  ]
}

/** Issue body: a readable summary for reviewers, then the JSON the importer reads. */
export function submissionBody(part: Part, editOf?: string, original?: Part): string {
  const before = new Map(original ? summaryRows(original).map(([, v, k]) => [k, v]) : [])
  const table = summaryRows(part)
    .filter(([, v, k]) => v !== undefined || before.get(k) !== undefined)
    .map(([label, v, k]) => {
      const mark = original && before.get(k) !== v ? ' ✎' : ''
      return `| ${label}${mark} | ${(v ?? '—').replace(/\|/g, '/')} |`
    })
  const sub: Submission = { kind: 'frame', version: 1, ...(editOf ? { editOf } : {}), part: { ...part, id: editOf ?? part.id } }
  return [
    editOf
      ? `Correction for \`${editOf}\`${original ? ` (${original.brand} ${original.name})` : ''}. Changed fields are marked ✎.`
      : `New frame: **${part.brand} ${part.name}**`,
    '',
    '| | |', '|---|---|', ...table,
    ...(part.specs.Notes ? ['', `> ${String(part.specs.Notes).replace(/\n/g, '\n> ')}`] : []),
    '',
    'Sources / anything a reviewer should know:',
    '',
    '',
    '<!-- Edit the JSON below if you need to fix something. The check bot re-runs on every edit. -->',
    '```json',
    JSON.stringify(sub, null, 2),
    '```',
  ].join('\n')
}

export function submissionIssueUrl(title: string, body: string): string {
  return `https://github.com/${SUBMISSION_REPO}/issues/new?${new URLSearchParams({ title, body })}`
}
