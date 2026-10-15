#!/usr/bin/env node
// Imports a community frame submission — the GitHub issue the app's "Add a frame" page opens —
// into the catalog.
//
//   node scripts/import-submission.mjs <issue-number>        fetch the issue with gh, check, write
//   node scripts/import-submission.mjs <file | -> [--check]   read an issue body from a file / stdin
//
// --check validates only and prints a Markdown report (the issue bot posts it); it never writes.
// New frames are appended to src/data/parts/frames.community.json. Corrections ("editOf": an
// existing id) replace that entry in whichever frames*.json file has it. Review the diff, then
// run `node scripts/validate-catalog.mjs` and open a PR.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkPart, partsDir } from './catalog-rules.mjs'

const REPO = 'hudbud/bicycle-part-picker'
const COMMUNITY_FILE = 'frames.community.json'

const args = process.argv.slice(2)
const check = args.includes('--check')
const source = args.find((a) => !a.startsWith('--'))
if (!source) {
  console.error('usage: node scripts/import-submission.mjs <issue-number | file | -> [--check]')
  process.exit(2)
}

const body = /^\d+$/.test(source)
  ? JSON.parse(execFileSync('gh', ['issue', 'view', source, '--repo', REPO, '--json', 'body'], { encoding: 'utf8' })).body
  : readFileSync(source === '-' ? 0 : source, 'utf8')

// ---------- parse + sanitize ----------

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined)
const slug = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
/** Brand + model with punctuation and "frame(set)" dropped, to catch the same frame under another id. */
const nameKey = (brand, name) => slug(`${brand} ${name}`).replace(/-(frame|frameset)(?=-|$)/g, '').replace(/-/g, '')

function parse(text) {
  const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)]
  if (!blocks.length) throw new Error('No ```json block found in the issue. Use the "Add a frame" page to generate one.')
  const data = JSON.parse(blocks.at(-1)[1])
  if (data?.kind !== 'frame' || typeof data.part !== 'object' || data.part === null) throw new Error('The JSON block isn\'t a frame submission ("kind": "frame" with a "part").')
  return data
}

/** Only the fields a catalog entry has, with strings trimmed and sizes capped. */
function clean(p) {
  const specs = {}
  for (const [k, v] of Object.entries(p.specs ?? {}).slice(0, 20)) {
    const key = str(k, 40)
    const val = typeof v === 'number' ? v : str(v, 400)
    if (key && val !== undefined && val !== '') specs[key] = val
  }
  // Attr values pass through as-is: checkPart reports unknown keys and bad values.
  const attrs = typeof p.attrs === 'object' && p.attrs !== null && !Array.isArray(p.attrs) ? { ...p.attrs } : p.attrs
  // Older versions of the form sent a bike-type "Use" list; the catalog no longer has it.
  if (attrs && typeof attrs === 'object') delete attrs.disciplines
  const entry = {
    id: '',
    name: str(p.name, 100),
    brand: str(p.brand, 60),
    category: 'frame',
    price: typeof p.price === 'number' ? Math.round(p.price * 100) / 100 : p.price,
    weightG: typeof p.weightG === 'number' ? Math.round(p.weightG) : p.weightG,
    year: p.year,
    ...(p.discontinued ? { discontinued: true } : {}),
    ...(str(p.url, 300) ? { url: str(p.url, 300) } : {}),
    attrs,
    specs,
    tags: (Array.isArray(p.tags) ? p.tags : []).map((t) => str(t, 24)).filter(Boolean).slice(0, 8),
  }
  return entry
}

// ---------- catalog lookup ----------

const frameFiles = readdirSync(partsDir).filter((f) => /^frames(\..+)?\.json$/.test(f))
const catalog = new Map() // id → file
const frameNames = new Map() // nameKey → id
for (const f of readdirSync(partsDir).filter((f) => f.endsWith('.json'))) {
  for (const p of JSON.parse(readFileSync(join(partsDir, f), 'utf8'))) {
    catalog.set(p.id, f)
    if (p.category === 'frame') frameNames.set(nameKey(p.brand, p.name), p.id)
  }
}

// ---------- check ----------

let entry, target, problems
try {
  const data = parse(body)
  entry = clean(data.part)
  const editOf = str(data.editOf, 120)
  if (editOf) {
    target = catalog.get(editOf)
    if (!target || !frameFiles.includes(target)) throw new Error(`"editOf": "${editOf}" isn't a frame in the catalog.`)
    entry.id = editOf
  } else {
    target = COMMUNITY_FILE
    const year = entry.discontinued && Number.isInteger(entry.year) ? `-${entry.year}` : ''
    entry.id = slug(`${entry.brand ?? ''} ${entry.name ?? ''}`).replace(/-frame(set)?$/, '') + year
    if (!entry.tags.includes('Community')) entry.tags.push('Community')
    const same = catalog.has(entry.id) ? entry.id : frameNames.get(nameKey(entry.brand ?? '', entry.name ?? ''))
    if (same) throw new Error(`This looks like \`${same}\`, which is already in the catalog (${catalog.get(same)}). If it's the same frame, open it in the app and use "Suggest a correction"; if it's a different year or version, put that in the model name.`)
  }
  problems = checkPart(entry)
} catch (e) {
  problems = [e.message]
}

const title = entry?.brand && entry?.name ? `${entry.brand} ${entry.name}` : 'this frame'
if (check) {
  console.log(problems.length
    ? `### ✖ Needs a fix\n\n${problems.map((m) => `- ${m}`).join('\n')}\n\nEdit the JSON in this issue to fix it. This check runs again on every edit.`
    : `### ✓ Ready to import\n\n**${title}** → \`${target}\` as \`${entry.id}\`${target === COMMUNITY_FILE ? '' : ' (correction)'}.\n\nMaintainers: \`node scripts/import-submission.mjs <this issue number>\`, review the diff, open a PR.`)
  process.exit(0)
}

if (problems.length) {
  console.error(`✖ ${title}:\n${problems.map((m) => `  - ${m}`).join('\n')}`)
  process.exit(1)
}

// ---------- write ----------

const path = join(partsDir, target)
let text = '[]\n'
try { text = readFileSync(path, 'utf8') } catch { /* new community file */ }
const parts = JSON.parse(text)
const at = parts.findIndex((p) => p.id === entry.id)
// Corrections keep the curated tags and any specs the form doesn't edit.
if (at >= 0) parts[at] = { ...parts[at], ...entry, specs: { ...parts[at].specs, ...entry.specs }, tags: parts[at].tags }
else parts.push(entry)
// Keep each file's existing style: one entry per line, or pretty-printed.
const compact = /^\[\n  \{"/.test(text)
writeFileSync(path, compact ? `[\n${parts.map((p) => `  ${JSON.stringify(p)}`).join(',\n')}\n]\n` : `${JSON.stringify(parts, null, 2)}\n`)
console.log(`✓ ${at >= 0 ? 'Updated' : 'Added'} ${title} (${entry.id}) in ${target}. Run node scripts/validate-catalog.mjs, review the diff, open a PR.`)
