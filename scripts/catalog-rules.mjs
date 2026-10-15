// The PartAttrs contract in src/types/parts.ts, as data checks. Shared by validate-catalog.mjs
// (the whole catalog) and import-submission.mjs (one community submission).
// Enum lists live in scripts/catalog-enums.json (extracted from the TS unions).
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const partsDir = join(root, 'src/data/parts')
export const E = JSON.parse(readFileSync(join(root, 'scripts/catalog-enums.json'), 'utf8'))

const enumKey = {
  material: 'Material', wheelSize: 'WheelSize', bbShell: 'BottomBracketShell', bbSpindle: 'BottomBracketSpindle',
  steerer: 'Steerer', headsetStd: 'HeadsetStandard', frontAxle: 'FrontAxle', rearAxle: 'RearAxle',
  brakeMount: 'BrakeMount', brakeType: 'BrakeType', rotorInterface: 'RotorInterface', freehub: 'Freehub',
  shiftSystem: 'ShiftSystem', handlebarType: 'HandlebarType', pedalSystem: 'PedalSystem', suspension: 'Suspension',
  cablePull: 'CablePull', shifterMount: 'ShifterMount',
}
const arrayEnumKey = { wheelSizes: 'WheelSize' }
const literal = {
  shockMount: ['Trunnion', 'Standard'], springType: ['Air', 'Coil'], chainringCount: [1, 2, 3],
  frontDerailleurMount: ['Braze-on', 'Clamp', 'Direct Mount', 'None'],
}
const numberKeys = ['maxTireMm', 'tireWidthMm', 'rimInternalMm', 'rimDepthMm', 'rotorSizeMm', 'maxRotorMm', 'travelMm', 'maxForkTravelMm', 'speeds', 'crankLengthMm', 'smallestCogT', 'largestCogT', 'maxCogT', 'barClampMm', 'barWidthMm', 'stemLengthMm', 'stemAngleDeg', 'seatpostMm', 'setbackMm', 'saddleWidthMm', 'brakeReachMm', 'reachMinMm', 'reachMaxMm']
const boolKeys = ['tubeless', 'electronic', 'udh', 'udhRequired', 'derailleurHanger', 'flattop', 'dropper', 'includesLevers', 'downtubeBosses']
const stringKeys = ['color', 'shockSize', 'chainrings', 'cassetteRange', 'railMaterial']
export const KNOWN_ATTRS = new Set([...Object.keys(enumKey), ...Object.keys(arrayEnumKey), ...Object.keys(literal), ...numberKeys, ...boolKeys, ...stringKeys])

/** Attributes the compatibility checker / filters rely on. */
export const REQUIRED = {
  frame: ['material', 'wheelSizes', 'maxTireMm', 'bbShell', 'rearAxle', 'brakeMount', 'headsetStd', 'steerer', 'seatpostMm', 'suspension', 'derailleurHanger', 'frontDerailleurMount', 'udh', 'maxForkTravelMm'],
  fork: ['material', 'travelMm', 'wheelSizes', 'steerer', 'frontAxle', 'brakeMount', 'maxTireMm'],
  rearShock: ['shockSize', 'shockMount', 'springType'],
  headset: ['headsetStd', 'steerer'],
  wheels: ['wheelSize', 'material', 'rimInternalMm', 'rimDepthMm', 'frontAxle', 'rearAxle', 'freehub', 'rotorInterface', 'tubeless'],
  hub: ['rotorInterface'],
  rim: ['wheelSize', 'material', 'rimInternalMm', 'tubeless'],
  spokes: [],
  tires: ['wheelSize', 'tireWidthMm', 'tubeless'],
  crankset: ['speeds', 'chainrings', 'chainringCount', 'bbSpindle'],
  bottomBracket: ['bbShell', 'bbSpindle'],
  chain: ['speeds', 'flattop'],
  cassette: ['speeds', 'cassetteRange', 'freehub', 'smallestCogT', 'largestCogT'],
  sprocket: ['smallestCogT', 'freehub', 'speeds'],
  rearDerailleur: ['speeds', 'shiftSystem', 'maxCogT', 'electronic', 'udhRequired'],
  frontDerailleur: ['speeds', 'frontDerailleurMount', 'electronic'],
  shifters: ['shiftSystem', 'electronic', 'shifterMount'],
  brakes: ['brakeType', 'brakeMount'],
  brakeLevers: ['handlebarType', 'brakeType'],
  rotors: ['rotorSizeMm', 'rotorInterface'],
  handlebars: ['material', 'handlebarType', 'barClampMm', 'barWidthMm'],
  stem: ['material', 'stemLengthMm', 'stemAngleDeg', 'barClampMm', 'steerer'],
  seatpost: ['material', 'seatpostMm', 'dropper'],
  saddle: ['saddleWidthMm', 'railMaterial'],
  pedals: ['pedalSystem'],
}

export const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_YEAR = 2026

/** Problems with one catalog entry (empty = valid). Doesn't check id uniqueness. */
export function checkPart(p) {
  const out = []
  const err = (msg) => out.push(msg)
  if (typeof p !== 'object' || p === null || Array.isArray(p)) return ['entry must be an object']
  if (typeof p.id !== 'string' || !ID_PATTERN.test(p.id)) err('id must be kebab-case [a-z0-9-]')
  for (const k of ['name', 'brand']) if (typeof p[k] !== 'string' || !p[k]) err(`missing ${k}`)
  if (!E.PartCategory.includes(p.category)) err(`bad category ${p.category}`)
  if (!(typeof p.price === 'number' && p.price > 0)) err('price must be a positive number (USD MSRP)')
  if (!(typeof p.weightG === 'number' && p.weightG > 0)) err('weightG must be a positive number')
  if (!(Number.isInteger(p.year) && p.year >= 1975 && p.year <= MAX_YEAR)) err(`year must be an integer 1975–${MAX_YEAR}`)
  if (p.discontinued !== undefined && typeof p.discontinued !== 'boolean') err('discontinued must be a boolean')
  if (p.year < 2005 && p.discontinued !== true) err('pre-2005 parts must be discontinued: true (price = used-market value)')
  if (p.url !== undefined && !(typeof p.url === 'string' && /^https?:\/\//.test(p.url))) err('url must be an http(s) link')
  if (!Array.isArray(p.tags)) err('tags must be an array')
  if (typeof p.specs !== 'object' || p.specs === null || Array.isArray(p.specs)) err('specs must be an object (use {} if none)')
  const a = p.attrs
  if (typeof a !== 'object' || a === null) return [...out, 'missing attrs']
  for (const [k, v] of Object.entries(a)) {
    if (!KNOWN_ATTRS.has(k)) err(`unknown attr "${k}"`)
    else if (enumKey[k] && !E[enumKey[k]].includes(v)) err(`${k}=${JSON.stringify(v)} not in ${enumKey[k]}: ${E[enumKey[k]].join(' | ')}`)
    else if (arrayEnumKey[k] && !(Array.isArray(v) && v.length > 0 && v.every((x) => E[arrayEnumKey[k]].includes(x)))) err(`${k} must be a non-empty array of ${arrayEnumKey[k]}: ${E[arrayEnumKey[k]].join(' | ')}`)
    else if (literal[k] && !literal[k].includes(v)) err(`${k}=${JSON.stringify(v)} not in ${literal[k].join(' | ')}`)
    else if (numberKeys.includes(k) && typeof v !== 'number') err(`${k} must be a number`)
    else if (boolKeys.includes(k) && typeof v !== 'boolean') err(`${k} must be a boolean`)
    else if (stringKeys.includes(k) && typeof v !== 'string') err(`${k} must be a string`)
  }
  for (const k of REQUIRED[p.category] ?? []) if (a[k] === undefined) err(`missing required attr ${k}`)
  if (p.category === 'frame' && a.suspension === 'Full Suspension') for (const k of ['shockSize', 'shockMount', 'travelMm']) if (a[k] === undefined) err(`full-suspension frame missing ${k}`)
  if (p.category === 'seatpost' && a.dropper && a.travelMm === undefined) err('dropper seatpost missing travelMm')
  const cableBrake = (t) => t && !t.startsWith('Hydraulic')
  if ((p.category === 'brakes' || p.category === 'brakeLevers') && cableBrake(a.brakeType) && a.cablePull === undefined) err('cable-actuated brake/lever missing cablePull')
  if (p.category === 'shifters' && cableBrake(a.brakeType) && a.cablePull === undefined) err('shifter with cable brake lever missing cablePull')
  if (p.category === 'brakes' && a.brakeType?.startsWith('Hydraulic') && a.includesLevers === undefined) err('hydraulic brakes missing includesLevers')
  if (p.category === 'shifters' && a.shiftSystem !== 'Friction' && a.speeds === undefined) err('indexed shifter missing speeds')
  if (p.category === 'shifters' && !['Downtube', 'Stem'].includes(a.shifterMount) && a.handlebarType === undefined) err('bar-mounted shifter missing handlebarType')
  if (p.category === 'stem' && a.steerer?.startsWith('Tapered')) err('stem steerer should be the clamp size (Straight 1-1/8", Straight 1", Threaded… for quills)')
  if (p.category === 'hub' && a.frontAxle === undefined && a.rearAxle === undefined) err('hub needs frontAxle and/or rearAxle')
  return out
}
