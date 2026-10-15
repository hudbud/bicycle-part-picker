#!/usr/bin/env node
// Validates src/data/parts/*.json against the PartAttrs contract in src/types/parts.ts.
// Usage: node scripts/validate-catalog.mjs [file.json ...]   (defaults to all catalog files)
// The per-entry rules live in scripts/catalog-rules.mjs.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { checkPart, partsDir } from './catalog-rules.mjs'

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => (f.includes('/') ? f : join(partsDir, f)))
  : readdirSync(partsDir).filter((f) => f.endsWith('.json')).map((f) => join(partsDir, f))

const allIds = new Map()
for (const f of readdirSync(partsDir).filter((f) => f.endsWith('.json'))) {
  for (const p of JSON.parse(readFileSync(join(partsDir, f), 'utf8'))) {
    allIds.set(p.id, [...(allIds.get(p.id) ?? []), f])
  }
}

let errors = 0
const err = (file, id, msg) => { errors++; console.log(`✖ ${file.split('/').pop()} ${id}: ${msg}`) }

for (const file of files) {
  let parts
  try { parts = JSON.parse(readFileSync(file, 'utf8')) } catch (e) { err(file, '-', `invalid JSON: ${e.message}`); continue }
  if (!Array.isArray(parts)) { err(file, '-', 'not an array'); continue }
  const cats = new Set()
  const seen = new Set()
  for (const p of parts) {
    const id = p?.id ?? '(no id)'
    if ((allIds.get(p?.id) ?? []).length > 1) err(file, id, `duplicate id (also in ${allIds.get(p.id).join(', ')})`)
    else if (seen.has(id)) err(file, id, 'duplicate id within file')
    seen.add(id)
    cats.add(p?.category)
    for (const msg of checkPart(p)) err(file, id, msg)
  }
  if (cats.size > 1) err(file, '-', `file mixes categories: ${[...cats].join(', ')}`)
  console.log(`${errors ? '…' : '✓'} ${file.split('/').pop()}: ${parts.length} parts`)
}
console.log(errors ? `\n${errors} problem(s)` : '\nAll good.')
process.exit(errors ? 1 : 0)
