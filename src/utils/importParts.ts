import type { Part, PartCategory } from '@/types/parts'
import type { PartCondition } from '@/types/build'
import { ALL_CATEGORIES, WHEEL_SUB_CATEGORIES } from '@/data/categoryConfig'
import { ALL_PARTS, getPartById, getPartsByCategory } from '@/data/partsDatabase'

/**
 * Parts-list import: turns a pasted list ("Frame: 1992 Bridgestone XO-1", Reddit tables,
 * our own markup/post exports…) into lines with a category and a best catalog match.
 * Pure — no React, no stores — so it can be checked from a script.
 */

// ---------------------------------------------------------------------------
// Text normalization + tokens
// ---------------------------------------------------------------------------

/** Lowercase, strip accents, unify quotes/×, and glue multi-word model names ("Dura Ace" → duraace). */
function fold(s: string): string {
  let t = s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/×/g, 'x')
  for (const [re, to] of PHRASES) t = t.replace(re, to)
  return t
}

const PHRASES: [RegExp, string][] = [
  [/(^|[^a-z0-9])'([7-9]\d)\b/g, '$119$2'],
  [/(^|[^a-z0-9])'([0-3]\d)\b/g, '$120$2'],
  [/\bdura[\s-]?ace\b|\bd\/a\b/g, 'duraace'],
  [/\bsuper[\s-]?record\b/g, 'superrecord'],
  [/\bsun[\s-]?tour\b/g, 'suntour'],
  [/\bdia[\s-]?compe\b/g, 'diacompe'],
  [/\brock[\s-]?shox\b/g, 'rockshox'],
  [/\brace[\s-]?face\b/g, 'raceface'],
  [/\bgrip[\s-]?shift\b/g, 'gripshift'],
  [/\bbar[\s-]?(?:ends?|cons?)\b/g, 'barend'],
  [/\bdown[\s-]?tubes?\b|\bdt\b(?=\s*shift)/g, 'downtube'],
  [/\bthumb[\s-]?(?:shifters?|ies)\b|\bthumbies\b/g, 'thumb shifters'],
  [/\bv[\s-]?brakes?\b/g, 'vbrake'],
  [/\bmini[\s-]?v\b/g, 'miniv'],
  [/\bsingle[\s-]?speed\b|\bss\b/g, 'singlespeed'],
  [/\bcantis?\b|\bcantilevers?\b/g, 'cantilever'],
  [/\bneo[\s-]?retro\b/g, 'neoretro'],
  [/\b(\d{1,2})\s*-?\s*(?:speed|spd|sp)\b/g, '$1s'],
  [/\b(700|650)\s+([bc])\b/g, '$1$2'],
  [/\b27\.5\b|\b650\s?b\b/g, '650b'],
  [/\b29er\b/g, '29'],
]

/** Words that say what kind of part it is, not which one — ignored when scoring a match. */
const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'with', 'w', 'to', 'on', 'of', 'for', 'in', 'my', 'is', 'was', 'from', 'by', 'at', 'very',
  'frame', 'frameset', 'fork', 'forks', 'headset', 'wheel', 'wheels', 'wheelset', 'hub', 'hubs', 'hubset', 'rim', 'rims',
  'spoke', 'spokes', 'tire', 'tires', 'tyre', 'tyres', 'crank', 'cranks', 'crankset', 'chainset', 'bottom', 'bracket', 'bb',
  'cartridge', 'chain', 'cassette', 'freewheel', 'cogs', 'cog', 'sprocket', 'derailleur', 'derailer', 'rd', 'fd', 'mech',
  'shifter', 'shifters', 'lever', 'levers', 'brake', 'brakes', 'caliper', 'calipers', 'bar', 'bars', 'handlebar', 'handlebars',
  'stem', 'post', 'seatpost', 'saddle', 'seat', 'pedal', 'pedals', 'rotor', 'rotors', 'shock', 'set', 'pair', 'front', 'rear',
  'new', 'used', 'stock', 'original', 'mm', 'cm',
])

/** Tokens: hyphenated codes are kept whole and split ("RD-M730" → rd, m730, rdm730); units dropped. */
function tokenize(s: string): string[] {
  const out: string[] = []
  const chunks = fold(s).match(/[a-z0-9]+(?:[-/.][a-z0-9]+)*/g) ?? []
  const push = (t: string) => {
    const unit = t.match(/^(\d+(?:\.\d+)?)(?:mm|cm)$/)
    if (unit) t = unit[1]
    const plural = t.match(/^([a-z]+\d+)s$/)
    if (plural) t = plural[1]
    if (STOP.has(t)) return
    // "centerpulls" ↔ "Centerpull" (both sides go through here, so the stem only has to be consistent)
    if (/^[a-z]{4,}s$/.test(t) && !/ss$/.test(t)) t = t.slice(0, -1)
    if (t.length > 1 && !STOP.has(t)) out.push(t)
  }
  for (const chunk of chunks) {
    const pieces = chunk.split(/[-/]|\.(?!\d)|(?<!\d)\./).filter(Boolean)
    for (const piece of pieces) {
      push(piece)
      const dims = piece.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:mm|c)?$/)
      if (dims) { push(dims[1]); push(dims[2]) }
    }
    if (chunk.includes('-') && pieces.length > 1) push(pieces.join(''))
  }
  return out
}

const isYear = (t: string) => /^(19[6-9]\d|20[0-3]\d)$/.test(t)
/** Model codes: M730, B17, UN55, XO1, RX100, 7700 — the most telling tokens. */
const isModelCode = (t: string) =>
  !isYear(t) &&
  ((/[a-z]/.test(t) && /\d/.test(t) && t.length <= 8 && !/^\d+(?:s|t|x|in)$/.test(t) && !/^\d+x\d/.test(t) && !/^\d+[bc]$/.test(t)) ||
    /^\d{3,4}$/.test(t))
/** "M730", "M737" and "M8100" share a family (same leading letters) — naming a different member is a contradiction. */
const codeFamily = (t: string) => (/^\d/.test(t) ? '#' : t.replace(/\d.*$/, ''))

/**
 * Words that pick one of several kinds within a category. Naming one of a group while the
 * part says another ("bar-end" vs "Downtube Shifters") is a contradiction, not just a miss.
 */
const DISCRIMINATORS: string[][] = [
  ['barend', 'downtube', 'thumb', 'trigger', 'gripshift', 'twist'],
  ['cantilever', 'vbrake', 'miniv', 'centerpull', 'sidepull', 'ubrake', 'disc', 'hydraulic', 'mechanical'],
  ['single', 'double', 'triple'],
  ['racing', 'touring', 'sport', 'comfort'],
  ['threaded', 'threadless'],
  ['flat', 'drop', 'riser', 'bullhorn', 'swept', 'mustache'],
]
const DISCRIMINATOR_GROUP = new Map(DISCRIMINATORS.flatMap((g, i) => g.map((w) => [w, i] as const)))

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

const BRAND_NOISE = /\b(components?|component engineering|engineering|bikes?|bicycles?|cycles?|cycle works|co\.?|racing shox|shox|racing|parts co\.?)\b/g

/** "Paul Component Engineering", "Paul Component" and "Paul" all → "paul". */
function brandKey(brand: string): string {
  const k = fold(brand).replace(/\(.*?\)/g, ' ').replace(BRAND_NOISE, ' ').replace(/[^a-z0-9]+/g, ' ').trim()
  return k || fold(brand).replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Nicknames and old names → brand key. */
const BRAND_ALIASES: Record<string, string> = {
  compass: 'rene herse', 'compass cycles': 'rene herse', paul: 'paul', pce: 'paul', phil: 'phil wood', king: 'chris king', ck: 'chris king',
  vo: 'velo orange', wi: 'white industries', campy: 'campagnolo', campag: 'campagnolo', ringle: 'sun ringle', 'sun ringle': 'sun ringle',
  sakae: 'sr sakae', sr: 'sr sakae', 'dt': 'dt swiss', stans: 'stan s notubes', fox: 'fox', manitou: 'answer manitou', crust: 'crust',
  'shimano pro': 'shimano pro', 'rene herse': 'rene herse', ritchey: 'ritchey', blackburn: 'blackburn',
}

/** Group/model names that imply a brand ("Deore XT" → Shimano). Weaker evidence than the brand itself. */
const IMPLIED_BRAND: Record<string, string> = {
  duraace: 'shimano', ultegra: 'shimano', xtr: 'shimano', xt: 'shimano', deore: 'shimano', lx: 'shimano', stx: 'shimano', dx: 'shimano',
  exage: 'shimano', tiagra: 'shimano', sora: 'shimano', claris: 'shimano', grx: 'shimano', slx: 'shimano', saint: 'shimano', zee: 'shimano',
  sis: 'shimano', superrecord: 'campagnolo', record: 'campagnolo', chorus: 'campagnolo', centaur: 'campagnolo', athena: 'campagnolo',
  veloce: 'campagnolo', ekar: 'campagnolo', eagle: 'sram', rival: 'sram', apex: 'sram', gx: 'sram', nx: 'sram', xx1: 'sram', x01: 'sram',
  accushift: 'suntour', superbe: 'suntour', technomic: 'nitto', albatross: 'nitto',
}

/** Brand names that are also ordinary words — only count when they lead the line. */
const AMBIGUOUS_BRANDS = new Set(['time', 'look', 'vision', 'token', 'reserve', 'mission', 'pillar', 'fabric', 'salt', 'hunt', 'rotor', 'simplex', 'works', 'state', 'answer', 'fly', 'evil', 'open', 'boone', 'deity', 'redshift', 'onza', 'columbus', 'merlin', 'tioga', 'avocet'])

interface BrandInfo { key: string; tokens: string[]; display: string }
let brandIndex: BrandInfo[] | null = null
function brands(): BrandInfo[] {
  if (brandIndex) return brandIndex
  const seen = new Map<string, BrandInfo>()
  for (const p of ALL_PARTS) {
    const key = brandKey(p.brand)
    if (key && !seen.has(key)) seen.set(key, { key, tokens: key.split(' '), display: p.brand })
  }
  for (const [alias, key] of Object.entries(BRAND_ALIASES)) {
    if (!seen.has(alias)) seen.set(alias, { key, tokens: alias.split(' '), display: seen.get(key)?.display ?? alias })
  }
  // Longest first so "sun ringle" wins over "sun".
  brandIndex = [...seen.values()].sort((a, b) => b.tokens.length - a.tokens.length)
  return brandIndex
}

interface BrandHit { key: string; explicit: boolean; tokens: string[]; display: string; at: number }

/** Brands named (or implied) in already-folded words. */
function findBrands(words: string[]): BrandHit[] {
  const hits: BrandHit[] = []
  const used = new Set<number>()
  for (const b of brands()) {
    for (let i = 0; i + b.tokens.length <= words.length; i++) {
      if (b.tokens.some((t, j) => words[i + j] !== t || used.has(i + j))) continue
      if (b.tokens.length === 1 && AMBIGUOUS_BRANDS.has(b.key) && i !== 0) continue
      b.tokens.forEach((_, j) => used.add(i + j))
      if (!hits.some((h) => h.key === b.key)) hits.push({ key: b.key, explicit: true, tokens: b.tokens, display: b.display, at: i })
    }
  }
  for (const w of words) {
    const key = IMPLIED_BRAND[w]
    if (key && !hits.some((h) => h.key === key)) hits.push({ key, explicit: false, tokens: [], display: '', at: 99 })
  }
  return hits
}

const words = (s: string) => fold(s).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean)

/** Leading brand as the user typed it ("Nitto S65" → { brand: "Nitto", rest: "S65" }) — for custom parts. */
export function splitBrand(value: string): { brand: string; name: string } {
  const text = value.trim()
  const lead = text.split(/\s+/)
  const hit = findBrands(words(text)).find((h) => h.explicit && h.at === 0)
  if (hit) {
    // The brand's folded words may span fewer typed words ("All-City" is two).
    let n = 0
    for (let seen = 0; n < lead.length && seen < hit.tokens.length; n++) seen += words(lead[n]).length
    return { brand: lead.slice(0, n).join(' '), name: lead.slice(n).join(' ') || text }
  }
  return { brand: '', name: text }
}

// ---------------------------------------------------------------------------
// Catalog index (per category pool, built lazily)
// ---------------------------------------------------------------------------

interface IndexedPart {
  part: Part
  brand: string
  /** Name tokens, brand words removed — what the part is called. */
  name: string[]
  /** Name + id + model-ish tag tokens — anything a user might type. */
  all: Set<string>
  tags: Set<string>
  codes: string[]
  years: string[]
  /** Discriminator group → the words of it this part uses. */
  kinds: Map<number, Set<string>>
  /** Letter+digit codes, for "XD" ≈ "XD2" partial credit. */
  prefixes: string[]
}

interface Pool {
  parts: IndexedPart[]
  idf: Map<string, number>
  /** Parts per brand key in this pool. */
  brandCount: Map<string, number>
}

const pools = new Map<string, Pool>()

function indexPart(p: Part): IndexedPart {
  const brandWords = new Set(words(p.brand))
  const key = brandKey(p.brand)
  for (const w of key.split(' ')) brandWords.add(w)
  const drop = (t: string) => !brandWords.has(t)
  const name = [...new Set(tokenize(p.name))].filter(drop)
  const id = tokenize(p.id.replace(/-/g, ' ')).filter(drop)
  const attrBits = [p.attrs?.chainrings, p.attrs?.cassetteRange].filter(Boolean).join(' ')
  const tags = new Set([...p.tags.flatMap((t) => tokenize(t)), ...tokenize(attrBits)].filter(drop))
  const all = new Set([...name, ...id])
  const codes = [...all].filter(isModelCode)
  const kinds = new Map<number, Set<string>>()
  for (const t of [...all, ...tags]) {
    const g = DISCRIMINATOR_GROUP.get(t)
    if (g !== undefined) kinds.set(g, (kinds.get(g) ?? new Set()).add(t))
  }
  const years = [...all].filter(isYear)
  if (p.year && p.discontinued) years.push(String(p.year))
  return { part: p, brand: key, name, all, tags, codes, years, kinds, prefixes: [...all].filter((t) => /^[a-z]+\d+$/.test(t)) }
}

function getPool(category?: PartCategory): Pool {
  const k = category ?? '*'
  const hit = pools.get(k)
  if (hit) return hit
  const parts = (category ? getPartsByCategory(category) : ALL_PARTS).map(indexPart)
  const df = new Map<string, number>()
  for (const ip of parts) for (const t of new Set([...ip.all, ...ip.tags])) df.set(t, (df.get(t) ?? 0) + 1)
  const idf = new Map<string, number>()
  for (const [t, n] of df) idf.set(t, Math.log(1 + parts.length / n))
  const brandCount = new Map<string, number>()
  for (const ip of parts) brandCount.set(ip.brand, (brandCount.get(ip.brand) ?? 0) + 1)
  const pool = { parts, idf, brandCount }
  pools.set(k, pool)
  return pool
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export type Confidence = 'high' | 'medium' | 'low' | 'none'

export interface MatchResult {
  /** Best catalog part, when confident enough to suggest it (high/medium/low). */
  part?: Part
  confidence: Confidence
  score: number
  /** Best candidates first (includes `part`), up to 6 — for a "did you mean" picker. */
  alternatives: Part[]
}

const NO_MATCH: MatchResult = { confidence: 'none', score: 0, alternatives: [] }

const HIGH = 0.72
const MEDIUM = 0.55
const LOW = 0.4

function confidenceFor(score: number): Confidence {
  return score >= HIGH ? 'high' : score >= MEDIUM ? 'medium' : score >= LOW ? 'low' : 'none'
}

/** Unknown words (not in any catalog name) still count against a match, just less. */
const UNKNOWN_WEIGHT = 0.8

function scorePart(ip: IndexedPart, q: string[], qBrands: BrandHit[], qYear: string | undefined, pool: Pool): number {
  const w = (t: string) => pool.idf.get(t) ?? UNKNOWN_WEIGHT
  // Precision: how much of what the user typed this part explains.
  let qTotal = 0
  let qHit = 0
  for (const t of q) {
    const wt = w(t)
    qTotal += wt
    if (ip.all.has(t)) qHit += wt
    else if (ip.tags.has(t)) qHit += wt * 0.3
    else if (t.length >= 2 && /^[a-z]+$/.test(t) && ip.prefixes.some((c) => c.startsWith(t) && /^\d+$/.test(c.slice(t.length)))) qHit += wt * 0.5
  }
  // Recall: how much of the part's own name the user typed.
  let pTotal = 0
  let pHit = 0
  for (const t of ip.name) {
    const wt = w(t)
    pTotal += wt
    if (q.includes(t)) pHit += wt
  }
  const precision = qTotal ? qHit / qTotal : 0
  const recall = pTotal ? pHit / pTotal : 0

  const explicit = qBrands.filter((b) => b.explicit)
  const brandHit = qBrands.find((b) => b.key === ip.brand)
  let brand = 0
  if (brandHit) brand = brandHit.explicit ? 0.14 : 0.07
  else if (explicit.length) brand = -0.22

  if (qHit === 0) {
    // Just a brand ("Phil Wood hubs"): a guess when the brand makes only one or two of these, else nothing.
    if (!q.length && brandHit?.explicit && (pool.brandCount.get(ip.brand) ?? 0) <= 2) return 0.42
    // "Nitto S65" against other Nitto posts: a candidate to show, never a match.
    return Math.min(0.3, Math.max(0, brand + (q.length ? 0 : 0.2)))
  }

  let s = 0.62 * precision + 0.38 * recall + brand

  const qCodes = q.filter(isModelCode)
  const hitCodes = qCodes.filter((c) => ip.all.has(c))
  s += Math.min(0.16, hitCodes.length * 0.08)
  const families = new Set(ip.codes.map(codeFamily))
  if (qCodes.some((c) => !ip.all.has(c) && families.has(codeFamily(c)))) s -= 0.15
  for (const t of q) {
    const g = DISCRIMINATOR_GROUP.get(t)
    const theirs = g === undefined ? undefined : ip.kinds.get(g)
    if (theirs && !theirs.has(t)) { s -= 0.2; break }
  }

  if (qYear) {
    if (ip.part.year === Number(qYear) || ip.years.includes(qYear)) s += 0.08
    else if (ip.years.length) s -= 0.2
  }
  // The user named a brand and this isn't it: show it as a candidate, never pick it.
  if (!brandHit && explicit.length) s = Math.min(s, 0.38)
  // Not capped at 1 here, so bonuses still rank two full matches.
  return Math.max(0, s)
}

interface QueryInfo { tokens: string[]; brands: BrandHit[]; year?: string }

function queryInfo(value: string): QueryInfo {
  const qBrands = findBrands(words(value))
  const brandTokens = new Set(qBrands.flatMap((b) => b.tokens))
  const tokens = [...new Set(tokenize(value))].filter((t) => !brandTokens.has(t))
  const year = tokens.find(isYear)
  return { tokens, brands: qBrands, year }
}

/**
 * Best catalog match for a pasted value. With a category, only that category's catalog
 * is searched; without one, the whole catalog (the match's category becomes the guess).
 */
export function matchPart(category: PartCategory | undefined, value: string): MatchResult {
  const q = queryInfo(value)
  if (!q.tokens.length && !q.brands.some((b) => b.explicit)) return NO_MATCH
  const pool = getPool(category)
  const scored = pool.parts
    .map((ip) => ({ ip, s: scorePart(ip, q.tokens, q.brands, q.year, pool) }))
    .filter((x) => x.s > 0.12)
    .sort((a, b) => b.s - a.s || Number(!!a.ip.part.discontinued) - Number(!!b.ip.part.discontinued))
  if (!scored.length) return NO_MATCH
  let top = Math.min(1, scored[0].s)
  // Two different parts scoring about the same can't both be right.
  // (Unless the top one's whole name was typed: "Brooks B17" is the B17, not the B17 Special.)
  const typedWholeName = scored[0].ip.name.every((t) => q.tokens.includes(t))
  if (scored[1] && top - Math.min(1, scored[1].s) < 0.05 && !typedWholeName) top = top < 0.9 ? top - 0.08 : Math.min(top, 0.7)
  const confidence = confidenceFor(top)
  const alternatives = scored.slice(0, 6).map((x) => x.ip.part)
  return { part: confidence === 'none' ? undefined : scored[0].ip.part, confidence, score: Math.round(top * 100) / 100, alternatives }
}

// ---------------------------------------------------------------------------
// Labels → categories
// ---------------------------------------------------------------------------

const SYNONYMS: Record<string, PartCategory> = {
  frame: 'frame', frameset: 'frame', 'frame set': 'frame', bike: 'frame', 'frame fork': 'frame', 'frame and fork': 'frame', model: 'frame',
  fork: 'fork', forks: 'fork', 'front fork': 'fork',
  shock: 'rearShock', 'rear shock': 'rearShock',
  headset: 'headset', hs: 'headset', 'head set': 'headset',
  wheels: 'wheels', wheel: 'wheels', wheelset: 'wheels', 'wheel set': 'wheels', hoops: 'wheels',
  'front wheel': 'frontWheel', 'rear wheel': 'rearWheel',
  hubs: 'hub', hub: 'hub', hubset: 'hub', 'front hub': 'hub', 'rear hub': 'hub',
  rims: 'rim', rim: 'rim', spokes: 'spokes', spoke: 'spokes',
  tires: 'tires', tyres: 'tires', tire: 'tires', tyre: 'tires', rubber: 'tires', treads: 'tires',
  cranks: 'crankset', crank: 'crankset', crankset: 'crankset', cranksets: 'crankset', chainset: 'crankset', 'crank arms': 'crankset', crankarms: 'crankset',
  chainring: 'crankset', chainrings: 'crankset', rings: 'crankset', ring: 'crankset',
  bb: 'bottomBracket', 'bottom bracket': 'bottomBracket', 'bottom bracket bb': 'bottomBracket',
  chain: 'chain',
  cassette: 'cassette', freewheel: 'cassette', cogs: 'cassette', block: 'cassette', cluster: 'cassette', cogset: 'cassette',
  cog: 'sprocket', sprocket: 'sprocket', 'rear cog': 'sprocket', 'sprocket cog': 'sprocket',
  rd: 'rearDerailleur', 'rear der': 'rearDerailleur', 'r der': 'rearDerailleur', rder: 'rearDerailleur', 'rear derailleur': 'rearDerailleur',
  'rear derailer': 'rearDerailleur', 'rear mech': 'rearDerailleur', mech: 'rearDerailleur', derailleur: 'rearDerailleur', derailer: 'rearDerailleur',
  derailleurs: 'rearDerailleur', rear: 'rearDerailleur', 'rear derail': 'rearDerailleur',
  fd: 'frontDerailleur', 'front der': 'frontDerailleur', 'f der': 'frontDerailleur', fder: 'frontDerailleur', 'front derailleur': 'frontDerailleur',
  'front derailer': 'frontDerailleur', 'front mech': 'frontDerailleur', front: 'frontDerailleur',
  shifters: 'shifters', shifter: 'shifters', thumbies: 'shifters', 'thumb shifters': 'shifters', barcons: 'shifters', 'bar cons': 'shifters',
  'bar ends': 'shifters', 'bar end shifters': 'shifters', 'downtube shifters': 'shifters', 'dt shifters': 'shifters', brifters: 'shifters',
  sti: 'shifters', ergo: 'shifters', ergopower: 'shifters', 'shift levers': 'shifters', triggers: 'shifters', gripshift: 'shifters',
  'shifters levers': 'shifters', 'brake shift levers': 'shifters', 'shifters brake levers': 'shifters', controls: 'shifters',
  brakes: 'brakes', brake: 'brakes', calipers: 'brakes', caliper: 'brakes', cantis: 'brakes', cantilevers: 'brakes', 'v brakes': 'brakes',
  stoppers: 'brakes', brakeset: 'brakes',
  levers: 'brakeLevers', lever: 'brakeLevers', 'brake levers': 'brakeLevers', 'brake lever': 'brakeLevers', bl: 'brakeLevers',
  rotors: 'rotors', rotor: 'rotors', 'disc rotors': 'rotors',
  bars: 'handlebars', bar: 'handlebars', handlebar: 'handlebars', handlebars: 'handlebars', 'bar s': 'handlebars', 'drop bars': 'handlebars',
  stem: 'stem', quill: 'stem',
  post: 'seatpost', seatpost: 'seatpost', 'seat post': 'seatpost', seatpin: 'seatpost', 'seat pin': 'seatpost', dropper: 'seatpost', 'dropper post': 'seatpost',
  saddle: 'saddle', seat: 'saddle', perch: 'saddle',
  pedals: 'pedals', pedal: 'pedals',
}
for (const c of [...ALL_CATEGORIES, ...WHEEL_SUB_CATEGORIES]) {
  SYNONYMS[normLabel(c.label)] ??= c.id
  SYNONYMS[normLabel(c.plural)] ??= c.id
}

/** Labels that aren't parts but are worth keeping. */
const FRAME_NOTE_LABELS = new Set(['size', 'frame size', 'color', 'colour', 'paint', 'finish', 'year'])
const BIKE_NOTE_LABELS = new Set(['note', 'notes', 'comments', 'comment', 'details', 'description'])
const PHOTO_LABELS = new Set(['photo', 'photos', 'pic', 'pics', 'picture', 'pictures', 'image', 'album', 'gallery'])
const EXTRA_LABELS = new Set(['extra', 'extras', 'accessories', 'accessory', 'other', 'misc'])
const SKIP_LABELS = new Set([
  'total', 'subtotal', 'grand total', 'weight', 'total weight', 'estimated weight', 'est weight', 'compatibility', 'price', 'prices',
  'cost', 'total cost', 'budget', 'generated', 'date', 'link', 'permalink', 'full build specs', 'pedal parts picker part list',
  'type', 'part', 'parts', 'component', 'components', 'category', 'item', 'slot', 'odometer', 'mileage', 'total paid', 'spec', 'specs',
  'build', 'build list', 'parts list', 'part list', 'build sheet',
])
/** Section headings from our post exports and common Reddit write-ups. */
const SECTION_HEADINGS = new Set(['frameset', 'wheels tires', 'drivetrain', 'brakes', 'cockpit', 'contact points', 'extras', 'other', 'parts', 'parts list', 'build list', 'specs', 'components', 'the build'])

function normLabel(s: string): string {
  return fold(s).replace(/[^a-z0-9]+/g, ' ').trim()
}

function labelCategories(label: string): PartCategory[] {
  const n = normLabel(label)
  const direct = SYNONYMS[n] ?? SYNONYMS[n.replace(/ /g, '')]
  if (direct) return [direct]
  // "Brakes/Levers", "Shifters & Derailleur"
  const parts = label.split(/\s*(?:\/|&|\+|,|\band\b)\s*/i).map(normLabel).filter(Boolean)
  if (parts.length < 2) return []
  const cats = parts.map((p) => SYNONYMS[p] ?? SYNONYMS[p.replace(/ /g, '')])
  return cats.every(Boolean) ? (cats as PartCategory[]) : []
}

/** Category nouns inside a value ("Tektro levers", "XT hubs") — the last one is the head noun. */
const VALUE_KEYWORDS: [RegExp, PartCategory][] = [
  [/\bbottom brackets?\b|\bbb\b/g, 'bottomBracket'],
  [/\bbrake levers?\b|\blevers?\b/g, 'brakeLevers'],
  [/\bshift(?:er)?s?\b|\bshift levers?\b|\bthumbies\b|\bbarcons?\b|\bbrifters?\b|\btriggers?\b|\bergopower\b/g, 'shifters'],
  [/\bfront (?:derailleur|derailer|mech)s?\b|\bfd\b/g, 'frontDerailleur'],
  [/\b(?:rear )?(?:derailleur|derailer)s?\b|\brd\b|\brear mech\b/g, 'rearDerailleur'],
  [/\bcrank(?:s|set|arms?)?\b|\bchainset\b|\bchainrings?\b/g, 'crankset'],
  [/\bcassettes?\b|\bfreewheel\b|\bcogset\b/g, 'cassette'],
  [/\bcog\b|\bsprocket\b/g, 'sprocket'],
  [/\bchain\b/g, 'chain'],
  [/\bhubs?\b|\bhubset\b/g, 'hub'],
  [/\brims?\b/g, 'rim'],
  [/\bspokes\b/g, 'spokes'],
  [/\bwheels?(?:set)?\b|\bhoops\b/g, 'wheels'],
  [/\b(?:tires?|tyres?)\b/g, 'tires'],
  [/\bbrakes?\b|\bcalipers?\b|\bcantis?\b|\bcantilevers?\b|\bv-?brakes?\b/g, 'brakes'],
  [/\brotors?\b/g, 'rotors'],
  [/\b(?:handle)?bars?\b/g, 'handlebars'],
  [/\bstem\b/g, 'stem'],
  [/\bseat ?posts?\b|\bpost\b/g, 'seatpost'],
  [/\bsaddle\b/g, 'saddle'],
  [/\bpedals?\b/g, 'pedals'],
  [/\bheadset\b/g, 'headset'],
  [/\bforks?\b/g, 'fork'],
  [/\bframe(?:set)?\b/g, 'frame'],
  [/\bshock\b/g, 'rearShock'],
]

export function categoryFromValue(value: string): PartCategory | undefined {
  const text = value.toLowerCase().replace(/bar[\s-]?end shifters?/g, 'shifters')
  let best: { end: number; len: number; cat: PartCategory } | undefined
  for (const [re, cat] of VALUE_KEYWORDS) {
    for (const m of text.matchAll(re)) {
      const end = (m.index ?? 0) + m[0].length
      if (!best || end > best.end || (end === best.end && m[0].length > best.len)) best = { end, len: m[0].length, cat }
    }
  }
  return best?.cat
}

// ---------------------------------------------------------------------------
// Line parsing
// ---------------------------------------------------------------------------

export type LineKind = 'part' | 'extra' | 'frameNote' | 'bikeNote' | 'title' | 'photo'

export interface ParsedLine {
  /** Unique within one parse: "<line>.<segment>". */
  id: string
  /** 0-based line number in the pasted text. */
  line: number
  /** The pasted line, trimmed. */
  raw: string
  kind: LineKind
  /** Label as typed ("RD", "Bars"), if any. */
  label?: string
  /** What's left to match: markup, bullets, prices and asides removed. */
  value: string
  category?: PartCategory
  categorySource: 'label' | 'value' | 'catalog' | 'none'
  /** Exact catalog id, from a product link in the line. */
  partId?: string
  /** Marked "(custom)" in one of our exports. */
  custom?: boolean
  quantity?: number
  pricePaid?: number
  condition?: PartCondition
  /** Image URL (kind 'photo') or the link found in the line. */
  url?: string
  /** Size / gearing bits pulled from the value: "58cm", "46/36", "68x113". */
  hints: string[]
  /** Hints + asides, ready for `slot.tracking.notes`. */
  note?: string
  /** Title lines: written as a name (bold, first line, or from our export) rather than a lead-in like "Here's my bike:". */
  named?: boolean
  match: MatchResult
}

const URL_RE = /\bhttps?:\/\/[^\s)\]]+/gi
const IMAGE_URL = /\.(?:jpe?g|png|gif|webp)(?:\?|$)|i\.imgur\.com|i\.redd\.it|imgur\.com\/(?:a|gallery)\//i
const PRODUCT_URL = /\/product\/([^/?#\s)]+)/

const HINT_PATTERNS: RegExp[] = [
  /\b\d{2,3}(?:\.\d)?\s?cm\b/gi,
  /\b\d{2,3}(?:\.\d)?\s?mm\b/gi,
  /\b\d{2}(?:\.\d)?\s?(?:"|in\b|inch\b)/gi,
  /\b\d{2}(?:\/\d{2}){1,2}t?\b/gi,
  /\b\d{2,3}(?:\.\d+)?\s?[x×]\s?\d{1,3}(?:\.\d+)?(?:mm|c|")?/gi,
  /(?<![\w-])\d{1,2}-\d{2}t?\b/gi,
  /\b\d{2}t\b/gi,
  /\b(?:700c|650b|26"|29er)\b/gi,
  /(?<![\w-])\d{1,2}(?:\s?-?\s?(?:speed|spd)|s)\b/gi,
]

function extractHints(value: string): string[] {
  const found: { at: number; text: string }[] = []
  for (const re of HINT_PATTERNS) {
    for (const m of value.matchAll(re)) {
      const at = m.index ?? 0
      const text = m[0].trim()
      if (found.some((f) => at < f.at + f.text.length && f.at < at + text.length)) continue
      found.push({ at, text })
    }
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.text)
}

const CONDITION_WORDS: [RegExp, PartCondition][] = [
  [/\bnos\b|\bnew old stock\b/i, 'nos'],
  [/\bused\s*[–—-]?\s*good\b/i, 'used-good'],
  [/\bused\s*[–—-]?\s*fair\b/i, 'used-fair'],
  [/\bneeds work\b/i, 'needs-work'],
  [/^new$/i, 'new'],
]

const STOCK_RE = /^(?:stock|original|orig|oem|matching|same|came with(?: the)? (?:frame|bike)|stock fork|original fork)\b/i

interface Ctx {
  /** The paste came from one of our exports: its prices are retail, not paid. */
  ownExport: boolean
  section?: string
  seenPart: boolean
  /** Past the point where a title line could appear. */
  seenPartLine?: boolean
}

function stripMarkup(line: string, urls: string[]): string {
  let s = line
  s = s.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (_m, u: string, t: string) => { urls.push(u); return t })
  s = s.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_m, u: string) => { urls.push(u); return '' })
  s = s.replace(/\[\/?(?:b|i|u|s|list|color(?:=[^\]]*)?|size(?:=[^\]]*)?|quote)\]/gi, '')
  s = s.replace(/^\s*\[\*\]\s*/, '')
  s = s.replace(/(?<!\\)\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, t: string, u: string) => { urls.push(u); return t })
  s = s.replace(URL_RE, (u) => { urls.push(u); return '' })
  return s
}

const unescapeMd = (s: string) => s.replace(/\\([\\`*_[\]~^>#|<\-+.()!])/g, '$1')

/** Splits `Label: value`, `Label - value`, `Label = value`. Returns undefined when there's no label. */
function splitLabel(s: string): { label: string; value: string } | undefined {
  const colon = s.search(/[:=]/)
  const dash = s.search(/\s[-–—]{1,2}\s/)
  const candidates: { at: number; len: number; dash: boolean }[] = []
  if (colon > 0) candidates.push({ at: colon, len: 1, dash: false })
  if (dash > 0) candidates.push({ at: dash, len: (s.slice(dash).match(/^\s[-–—]{1,2}\s/)?.[0].length ?? 3), dash: true })
  candidates.sort((a, b) => a.at - b.at)
  for (const c of candidates) {
    const label = s.slice(0, c.at).trim()
    const value = s.slice(c.at + c.len).trim()
    if (!label || label.length > 40 || label.split(/\s+/).length > 5) continue
    // A dash only separates a label we recognise — "Shimano 600 - tricolor" is a part name.
    if (c.dash && !labelCategories(label).length && !isKnownLabel(label)) continue
    return { label, value }
  }
  return undefined
}

function isKnownLabel(label: string): boolean {
  const n = normLabel(label)
  return FRAME_NOTE_LABELS.has(n) || BIKE_NOTE_LABELS.has(n) || PHOTO_LABELS.has(n) || EXTRA_LABELS.has(n) || SKIP_LABELS.has(n)
}

interface Cleaned {
  value: string
  notes: string[]
  quantity?: number
  pricePaid?: number
  condition?: PartCondition
  custom?: boolean
}

/** Pulls quantity, "(custom)", prices, condition and asides off a value. */
function cleanValue(input: string, ctx: Ctx): Cleaned {
  let v = input.trim()
  const notes: string[] = []
  const out: Cleaned = { value: '', notes }
  const qty = v.match(/^(\d{1,2})\s*[x×]\s+/)
  if (qty) { out.quantity = Number(qty[1]); v = v.slice(qty[0].length) }
  if (/\(custom\)/i.test(v)) { out.custom = true; v = v.replace(/\s*\(custom\)\s*/gi, ' ') }
  // Our post export: "Name (paid, condition) — note"
  const dashNote = v.match(/\s+[—–]\s+(.+)$/)
  if (dashNote) { notes.push(dashNote[1].trim()); v = v.slice(0, dashNote.index) }
  // Our markup export's price/retailer column: "  ($123.45 @ Merchant)", "(—)"
  v = v.replace(/\s*\((?:~?[$£€][\d,]+(?:\.\d+)?(?:\s*@\s*[^)]*)?|—|-)\)\s*$/, (m) => (ctx.ownExport ? '' : m))
  // Parentheticals: prices, conditions, weights; anything else is an aside for the notes.
  v = v.replace(/\(([^()]*)\)/g, (_m, inner: string) => {
    const keep: string[] = []
    for (const bit of inner.replace(/\bused,\s*(good|fair)\b/gi, 'used $1').split(/\s*,\s*/)) {
      const b = bit.trim()
      if (!b) continue
      const price = b.match(/^(?:paid\s+)?[$£€]\s?(\d[\d,]*(?:\.\d{1,2})?)\b(.*)$/i)
      if (price) {
        if (!ctx.ownExport || !/@/.test(b)) out.pricePaid ??= Number(price[1].replace(/,/g, ''))
        if (price[2].trim()) notes.push(price[2].trim())
        continue
      }
      if (/^free$/i.test(b)) { out.pricePaid ??= 0; continue }
      const cond = CONDITION_WORDS.find(([re]) => re.test(b))
      if (cond) { out.condition ??= cond[1]; continue }
      if (/^~?\d+(?:\.\d+)?\s?(?:kg|g|lbs?|oz)$/i.test(b) || /^planned$/i.test(b)) continue
      // Years and catalog-ish details ("1992", "Sidepull") stay in the matched text.
      if (/^(?:19|20)\d\d(?:\s?[–—/-]\s?\d{2,4})?$/.test(b) || /^'\d\d$/.test(b) || /^(?:early|mid|late)[- ]?'?\d0s$/i.test(b)) { keep.push(b); continue }
      if (extractHints(b).join(' ') === b) { keep.push(b); continue }
      notes.push(b)
    }
    return keep.length ? ` (${keep.join(', ')}) ` : ' '
  })
  // Bare prices: "XO-1 - $300", "XO-1 $300"
  if (!ctx.ownExport) {
    v = v.replace(/(?:\s[-–—,]\s*|\s)(?:paid\s+)?[$£€]\s?(\d[\d,]*(?:\.\d{1,2})?)\b/i, (_m, n: string) => {
      out.pricePaid ??= Number(n.replace(/,/g, ''))
      return ' '
    })
  }
  out.value = v.replace(/\s{2,}/g, ' ').replace(/[\s,;–—-]+$/, '').trim()
  return out
}

/** Pulls a "with half clips" tail off into the notes — not part of the part name. */
function splitWithTail(value: string): { value: string; tail?: string } {
  const m = value.match(/\s+(?:with|w\/)\s+(.+)$/i)
  if (!m || m.index === undefined || m.index < 3) return { value }
  return { value: value.slice(0, m.index).trim(), tail: m[0].trim() }
}

const SPLITTERS: RegExp[] = [/\s+laced to\s+/i, /\s+(?:\/|\+|&)\s+/, /\s+(?:with|w\/|and)\s+/i, /\s+on\s+(?=\S+\s+\S)/i, /,\s+/]

interface Segment { value: string; category: PartCategory }

/** "Paul Neo-Retro / Tektro levers" → brakes + brakeLevers; "XT hubs laced to A23s" → hub + rim. */
function splitSegments(value: string, cats: PartCategory[]): Segment[] | undefined {
  const main = cats[0]
  for (const re of SPLITTERS) {
    const parts = value.split(re).map((p) => p.trim()).filter(Boolean)
    if (parts.length < 2) continue
    if (cats.length > 1 && parts.length === cats.length) return parts.map((p, i) => ({ value: p, category: cats[i] }))
    const kws = parts.map((p) => categoryFromValue(p))
    const wheelBuild = (main === 'wheels' || main === 'hub' || main === 'rim') && kws.includes('hub')
    const different = kws.some((k, i) => i > 0 && k && k !== main)
    if (!wheelBuild && !different) continue
    // Every extra segment must say what it is, or it's probably part of the name.
    if (!wheelBuild && kws.slice(1).some((k) => !k)) continue
    return parts.map((p, i) => ({
      value: p,
      category: kws[i] ?? (wheelBuild ? (i === 0 && main !== 'wheels' ? main : 'rim') : main),
    }))
  }
  return undefined
}

function isProse(s: string): boolean {
  const n = s.split(/\s+/).length
  return n > 14 || (n > 6 && /[.?!]$/.test(s))
}

const joinNotes = (bits: string[]) => {
  const uniq = [...new Set(bits.map((b) => b.trim()).filter(Boolean))]
  return uniq.length ? uniq.join(', ') : undefined
}

function makeLine(base: Omit<ParsedLine, 'id' | 'match' | 'hints' | 'categorySource'> & Partial<Pick<ParsedLine, 'categorySource' | 'match' | 'hints'>>, seg: number): ParsedLine {
  return {
    categorySource: 'none',
    hints: [],
    match: NO_MATCH,
    ...base,
    id: `${base.line}.${seg}`,
  }
}

function partLine(
  lineNo: number,
  raw: string,
  label: string | undefined,
  value: string,
  category: PartCategory | undefined,
  source: ParsedLine['categorySource'],
  cleaned: Cleaned,
  extraNotes: string[],
  seg: number,
  partId?: string,
): ParsedLine {
  const hints = extractHints(value)
  // Frame sizes and bar widths in cm don't help matching; mm sizes ("68x113", "26.8mm") do.
  const matchText = value.replace(/\b\d{2,3}(?:\.\d)?\s?cm\b/gi, ' ')
  let cat = category
  let src = source
  let match: MatchResult
  const exact = partId ? getPartById(partId) : undefined
  if (exact && (!cat || exact.category === cat || (cat === 'frontWheel' || cat === 'rearWheel'))) {
    match = { part: exact, confidence: 'high', score: 1, alternatives: [exact] }
    cat ??= exact.category
    if (src === 'none') src = 'catalog'
  } else if (cat) {
    match = matchPart(cat, matchText)
  } else {
    const kw = categoryFromValue(value)
    if (kw) {
      cat = kw
      src = 'value'
      match = matchPart(kw, matchText)
    } else {
      match = matchPart(undefined, matchText)
      if (match.part && (match.confidence === 'high' || match.confidence === 'medium')) {
        cat = match.part.category
        src = 'catalog'
      }
    }
  }
  // "650B" next to a part called "… 650B" says nothing new; "58cm" or "11-42" does.
  const named = match.part && match.confidence !== 'low' ? fold(`${match.part.brand} ${match.part.name}`) : ''
  const newHints = hints.filter((h) => !named.includes(fold(h)))
  return makeLine({
    line: lineNo,
    raw,
    kind: 'part',
    label,
    value,
    category: cat,
    categorySource: src,
    partId: exact?.id,
    custom: cleaned.custom,
    quantity: cleaned.quantity,
    pricePaid: seg === 0 ? cleaned.pricePaid : undefined,
    condition: cleaned.condition,
    hints,
    note: joinNotes([...newHints, ...(seg === 0 ? cleaned.notes : []), ...extraNotes]),
    match,
  }, seg)
}

function parseLine(rawLine: string, lineNo: number, ctx: Ctx): ParsedLine[] {
  const raw = rawLine.trim()
  if (!raw) return []
  if (/^(?:#{1,6}\s|={3,}|-{3,}|\*{3,}|_{3,}|:?-{2,}:?\s*\|)/.test(raw)) {
    const h = raw.replace(/^#{1,6}\s+/, '')
    if (raw.startsWith('#')) ctx.section = normLabel(h)
    return []
  }
  if (/^\s*\|?\s*:?-{3,}/.test(raw) || /^\[\/?list\]$/i.test(raw)) return []
  // Table separator rows: "|:--|:--|", "--- | ---"
  if (raw.includes('|') && raw.split('|').every((c) => !c.trim() || /^:?-{2,}:?$/.test(c.trim()))) return []

  const urls: string[] = []
  let s = stripMarkup(raw, urls)

  // Reddit table rows: "| Frame | XO-1 | $300 |" / our export "**Frame** | [name](url) | 1.2 kg | $123 @ eBay"
  let tableLabel: string | undefined
  let tableExtra: string[] = []
  if (/(?<!\\)\|/.test(s)) {
    const cells = s.split(/(?<!\\)\|/).map((c) => unescapeMd(c).replace(/\*\*|__/g, '').trim())
    if (s.trim().startsWith('|')) cells.shift()
    if (s.trim().endsWith('|')) cells.pop()
    if (!cells[0]) return [] // export footer rows: " | **Total** | …"
    if (cells.length >= 2) {
      tableLabel = cells[0]
      s = cells[1]
      tableExtra = cells.slice(2)
    } else s = cells[0]
  }

  s = unescapeMd(s)
  // Bold-only line: a title (first) or a section heading.
  const boldOnly = s.trim().match(/^(?:\*\*|__)([^*_]+)(?:\*\*|__):?$/)
  s = s.replace(/\*\*|__|~~/g, '').replace(/(^|\s)\*(\S[^*]*\S|\S)\*(?=\s|$|[,.;:])/g, '$1$2')
  s = s.replace(/^\s*(?:[-*•·–—+>]+|\d{1,2}[.)])\s+/, '').trim()

  const url = urls.find((u) => !PRODUCT_URL.test(u))
  const productId = urls.map((u) => u.match(PRODUCT_URL)?.[1]).find(Boolean)
  const partId = productId ? decodeURIComponent(productId) : undefined

  if (!s) {
    if (url && IMAGE_URL.test(url)) return [makeLine({ line: lineNo, raw, kind: 'photo', value: url, url }, 0)]
    if (partId && getPartById(partId)) {
      const p = getPartById(partId)!
      return [partLine(lineNo, raw, undefined, `${p.brand} ${p.name}`, undefined, 'none', { value: '', notes: [] }, [], 0, partId)]
    }
    return []
  }

  const plain = normLabel(s)
  if (boldOnly || (s === s.toUpperCase() && /[A-Z]/.test(s) && !/\d/.test(s) && s.length < 30)) {
    if (SECTION_HEADINGS.has(plain) || (boldOnly && ctx.seenPart)) { ctx.section = plain; return [] }
  }
  if (/^(?:prices include|generated by|compatibility:|est\.? weight|estimated weight|full build (?:&|and) specs)/i.test(s)) return []
  if (urls.some((u) => findAppLink(u)) && s.split(/\s+/).length <= 5) return []

  let label = tableLabel
  let value = s
  if (!label) {
    const split = splitLabel(s)
    if (split) { label = split.label; value = split.value }
  }
  if (tableExtra.length && !ctx.ownExport) {
    const priceCell = tableExtra.find((c) => /[$£€]\s?\d/.test(c))
    if (priceCell) value += ` (${priceCell})`
  }

  if (label !== undefined) {
    const n = normLabel(label)
    if (!value.trim()) {
      // "Drivetrain:" — a heading. A bare "Frame:" with nothing after it too.
      ctx.section = n
      return []
    }
    if (SKIP_LABELS.has(n)) return []
    if (FRAME_NOTE_LABELS.has(n)) return [makeLine({ line: lineNo, raw, kind: 'frameNote', label, value: `${label}: ${value}` }, 0)]
    if (BIKE_NOTE_LABELS.has(n)) return [makeLine({ line: lineNo, raw, kind: 'bikeNote', label, value }, 0)]
    if (PHOTO_LABELS.has(n)) {
      if (url) return [makeLine({ line: lineNo, raw, kind: 'photo', value: url, url }, 0)]
      return []
    }
  }

  const cleaned = cleanValue(value, ctx)
  if (!cleaned.value && !partId) return []
  ctx.seenPart = true

  const labelN = label ? normLabel(label) : ''
  if ((label && EXTRA_LABELS.has(labelN)) || (!label && ctx.section === 'extras')) {
    return [makeLine({ line: lineNo, raw, kind: 'extra', label, value: cleaned.value, pricePaid: cleaned.pricePaid, note: joinNotes(cleaned.notes), url }, 0)]
  }

  let cats = label ? labelCategories(label) : []
  if (label && !cats.length) {
    // Unknown label. "Shimano XT: M730 rear derailleur" — maybe the whole line is the part.
    const whole = cleanValue(s, ctx)
    const kw = categoryFromValue(whole.value)
    const guess = matchPart(kw, whole.value)
    if (guess.confidence === 'high' || (kw && guess.confidence === 'medium')) {
      return [partLine(lineNo, raw, undefined, whole.value, kw ?? guess.part?.category, kw ? 'value' : 'catalog', whole, [], 0, partId)]
    }
    // "Grips: Ergon GP1", "Rack: Nitto M18" — kept as an extra item.
    return [makeLine({ line: lineNo, raw, kind: 'extra', label, value: `${label}: ${cleaned.value}`, pricePaid: cleaned.pricePaid, note: joinNotes(cleaned.notes), url }, 0)]
  }

  if (!label) {
    if (isProse(cleaned.value)) return []
    // First line, no label, nothing like a part: the bike's name ("My '92 XO-1").
    if (!ctx.seenPartLine && !partId) {
      const kw = categoryFromValue(cleaned.value)
      const m = matchPart(kw, cleaned.value)
      if ((boldOnly || lineNo === 0 || m.confidence === 'none') && !kw && m.confidence !== 'high' && cleaned.value.length < 70) {
        ctx.seenPartLine = true
        // A bold title or our own export's is the bike's name; a plain first line may just be "current setup".
        const named = !!boldOnly || ctx.ownExport
        return [makeLine({ line: lineNo, raw, kind: 'title', value: cleaned.value, named }, 0)]
      }
    }
  }
  ctx.seenPartLine = true

  // "Fork: stock" — resolved against the frame after the whole list is parsed.
  const { value: core, tail } = splitWithTail(cleaned.value)
  const segments = cats.length ? splitSegments(cleaned.value, cats) : undefined
  if (segments) {
    return segments.map((sg, i) => {
      const c = cleanValue(sg.value, ctx)
      return partLine(lineNo, raw, label, c.value || sg.value, sg.category, 'label', i === 0 ? { ...cleaned, value: c.value } : c, [], i, i === 0 ? partId : undefined)
    })
  }
  const useTail = tail && !STOCK_RE.test(core)
  return [partLine(lineNo, raw, label, useTail ? core : cleaned.value, cats[0], cats.length ? 'label' : 'none', cleaned, useTail ? [tail!] : [], 0, partId)]
}

/** Matching fork for "Fork: stock": same brand as the frame, sharing its model tokens/year. */
function stockFork(frame: Part): MatchResult {
  const m = matchPart('fork', `${frame.brand} ${frame.name}`)
  const part = m.alternatives.find((p) => brandKey(p.brand) === brandKey(frame.brand))
  if (!part || m.score < LOW) return { ...NO_MATCH, alternatives: m.alternatives }
  return { part, confidence: 'medium', score: m.score, alternatives: [part, ...m.alternatives.filter((p) => p.id !== part.id)] }
}

/**
 * Parses a pasted parts list. One line can yield several (a brakes line naming the levers too);
 * headers, totals, prose and blank lines yield none.
 */
export function parsePartsList(text: string): ParsedLine[] {
  const ctx: Ctx = { ownExport: /Pedal Parts Picker/i.test(text), seenPart: false }
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const out: ParsedLine[] = []
  lines.forEach((l, i) => out.push(...parseLine(l, i, ctx)))

  const frame = out.find((l) => l.kind === 'part' && l.category === 'frame' && l.match.part)?.match.part
  for (const l of out) {
    if (l.kind !== 'part' || l.category !== 'fork' || !STOCK_RE.test(l.value)) continue
    if (frame) l.match = stockFork(frame)
    l.note = joinNotes(['stock fork', ...(l.note ? [l.note] : [])])
  }
  return out
}

// ---------------------------------------------------------------------------
// Helpers for the import page
// ---------------------------------------------------------------------------

/** Bike name from the parse: a title written as a name, else the frame line ("1992 Bridgestone XO-1"). */
export function suggestBikeName(lines: ParsedLine[]): string {
  const named = lines.find((l) => l.kind === 'title' && l.named)
  if (named) return named.value.replace(/^\[|\]$/g, '').trim()
  const frame = lines.find((l) => l.kind === 'part' && l.category === 'frame')
  if (frame) {
    const name = frame.value.replace(/\([^)]*\)/g, ' ')
    const cleaned = name
      .replace(new RegExp(HINT_PATTERNS.map((r) => r.source).join('|'), 'gi'), ' ')
      .replace(/\s+(?:frame ?set|frame (?:&|and) fork|frame)\s*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (cleaned && !STOCK_RE.test(cleaned)) return cleaned
    if (frame.match.part) return `${frame.match.part.brand} ${frame.match.part.name}`
  }
  const title = lines.find((l) => l.kind === 'title')
  return title?.value.replace(/^\[|\]$/g, '').trim() ?? ''
}

export type AppLink = { kind: 'shared'; code: string } | { kind: 'bike'; code: string }

/** A link from this app pasted instead of a list: `/build/shared?b=…` or `/bike#…`. */
export function findAppLink(text: string): AppLink | undefined {
  const bike = text.match(/\/bike#([A-Za-z0-9_-]{8,})/)
  if (bike) return { kind: 'bike', code: bike[1] }
  const shared = text.match(/\/build\/[^\s?#]*\?(?:[^\s#]*&)?b=([^\s&#)\]]+)/)
  if (shared) return { kind: 'shared', code: decodeURIComponent(shared[1]) }
  return undefined
}

/** True when the text is basically just a link (vs a list that mentions one). */
export function isLinkOnly(text: string): boolean {
  return text.trim().split(/\s+/).length <= 2 && !!findAppLink(text)
}
