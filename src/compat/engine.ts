import type { Part, PartAttrs, PartCategory, ShiftSystem, Freehub } from '@/types/parts'
import type { Build, ComponentSlot } from '@/types/build'
import { resolvePart } from '@/data/partsDatabase'
import { getCategoryLabel } from '@/data/categoryConfig'
import { formatWheelSize, formatWeight } from '@/data/specSchema'
import { slotQuantity } from '@/data/pricing'

/**
 * Bike compatibility checker — the bike equivalent of PCPartPicker's.
 *
 * - error:   these parts physically won't work together.
 * - warning: works only with an adapter / shim / extra part, or is a likely mistake.
 * - note:    worth knowing, not a problem (e.g. "2x crank — add a front derailleur").
 *
 * Rules only fire when both sides have the relevant attribute, so custom parts and
 * partially-specified parts never produce false errors.
 */

export type IssueSeverity = 'error' | 'warning' | 'note'

export interface CompatIssue {
  /** Stable id: rule id + involved categories. */
  id: string
  severity: IssueSeverity
  message: string
  categories: PartCategory[]
}

type Parts = Partial<Record<PartCategory, Part>>

type Emit = (severity: IssueSeverity, rule: string, categories: PartCategory[], message: string) => void

const has = <K extends keyof PartAttrs>(p: Part | undefined, k: K): p is Part & { attrs: Required<Pick<PartAttrs, K>> } =>
  p?.attrs?.[k] !== undefined

const name = (p: Part) => `${p.brand} ${p.name}`

function collectParts(build: Build): Parts {
  const parts: Parts = {}
  for (const slot of build.components) {
    if (slot.part) parts[slot.category] = resolvePart(slot.part)
  }
  return parts
}

/** First selected part among `categories` that defines attribute `key`. */
function pick<K extends keyof PartAttrs>(parts: Parts, key: K, categories: PartCategory[]): [PartCategory, Part] | undefined {
  for (const c of categories) {
    const p = parts[c]
    if (has(p, key)) return [c, p]
  }
  return undefined
}

// Where each end of the bike gets its wheel info, in priority order.
const FRONT_WHEEL: PartCategory[] = ['frontWheel', 'wheels', 'hub', 'rim']
const REAR_WHEEL: PartCategory[] = ['rearWheel', 'wheels', 'hub', 'rim']

// Shift systems that share a cable pull with each other.
const SHIFT_FAMILIES: ShiftSystem[][] = [
  ['Shimano Road 11s', 'Shimano GRX 11s'],
  ['Shimano 7-9s', 'Shimano Road 10s'],
]

/** Can `shifter` drive `derailleur`? Friction shifters drive any cable derailleur. */
function shiftCompatible(shifter: Part, derailleur: Part): boolean {
  const a = shifter.attrs!.shiftSystem!, b = derailleur.attrs!.shiftSystem!
  if (a === 'Friction') return !derailleur.attrs?.electronic
  return a === b || SHIFT_FAMILIES.some((f) => f.includes(a) && f.includes(b))
}

/**
 * Do two speed counts work together? Rear derailleurs 7–10s are speed-agnostic within a
 * shift system (the shift-system rule covers pull ratio), and 5–8s chains are all 3/32".
 */
function speedsCompatible(category: PartCategory, s: number, drive: number): boolean {
  if (s === drive) return true
  if (category === 'rearDerailleur') return s >= 7 && s <= 10 && drive >= 7 && drive <= 10
  if (category === 'chain') return s <= 8 && drive <= 8
  return false
}

// Lever clamp families: road levers are 23.8mm, MTB levers 22.2mm.
const ROAD_LEVER_BARS = ['Drop', 'Integrated Drop', 'Bullhorn', 'Mustache']
const roadBar = (t: string) => ROAD_LEVER_BARS.includes(t)
const hydraulic = (t: string) => t.startsWith('Hydraulic')

/** severity of fitting `cassette` onto `hub`, or null if it fits as-is. */
function freehubFit(cassette: Freehub, hub: Freehub): { severity: IssueSeverity; how: string } | null {
  if (cassette === hub) return null
  if (cassette === 'SRAM XD' && hub === 'SRAM XDR') return { severity: 'note', how: 'fits with the 1.85mm spacer that ships with XDR wheels' }
  if (cassette === 'Shimano HG 8-10s / MTB' && hub === 'Shimano HG 11/12s Road') return { severity: 'note', how: 'fits with a 1.85mm spacer behind the cassette' }
  if (cassette === 'Shimano HG 11/12s Road' && hub === 'Shimano HG 8-10s / MTB') return { severity: 'warning', how: 'fits MTB-width HG bodies, but not older 10-speed road bodies — check your hub' }
  if (cassette === 'Shimano HG 7s' && hub === 'Shimano HG 8-10s / MTB') return { severity: 'note', how: 'fits with a 4.5mm spacer behind the cassette' }
  if (cassette === 'Shimano HG 7s' && hub === 'Shimano HG 11/12s Road') return { severity: 'note', how: 'fits with 1.85mm + 4.5mm spacers behind the cassette' }
  return { severity: 'error', how: '' }
}

const steererTop = (s: string) => (s.endsWith(' 1"') ? '1"' : '1-1/8"')
/** Head-tube size, ignoring threads: 'tapered' | '1-1/8"' | '1"'. */
const steererSize = (s: string) => (s.startsWith('Tapered') ? 'tapered' : steererTop(s))
const threaded = (s: string) => s.startsWith('Threaded')

function runRules(p: Parts, emit: Emit) {
  const { frame, fork, headset, stem, tires, cassette, sprocket, chain, crankset, bottomBracket, rearDerailleur, frontDerailleur, shifters, brakes, brakeLevers, rotors, handlebars, seatpost, rearShock } = p
  const front = (k: keyof PartAttrs) => pick(p, k, FRONT_WHEEL)
  const rear = (k: keyof PartAttrs) => pick(p, k, REAR_WHEEL)

  // ---------- Frameset: steerer & headset ----------
  if (has(frame, 'steerer') && has(fork, 'steerer')) {
    const f = frame.attrs.steerer, k = fork.attrs.steerer
    if (steererSize(f) !== steererSize(k)) {
      if (f.startsWith('Tapered') && steererSize(k) === '1-1/8"') {
        emit('warning', 'steerer', ['frame', 'fork'], `${name(fork)} has a straight 1-1/8" steerer; ${name(frame)} has a tapered head tube. It will only fit with a reducing lower headset cup.`)
      } else {
        emit('error', 'steerer', ['frame', 'fork'], `${name(fork)} has a ${k} steerer, which won't fit the ${f} head tube on ${name(frame)}.`)
      }
    }
  }
  if (has(headset, 'headsetStd') && has(frame, 'headsetStd') && headset.attrs.headsetStd !== frame.attrs.headsetStd) {
    emit('error', 'headset-frame', ['headset', 'frame'], `${name(headset)} is ${headset.attrs.headsetStd}, but ${name(frame)} needs a ${frame.attrs.headsetStd} headset.`)
  }
  if (has(headset, 'steerer') && has(fork, 'steerer') && headset.attrs.steerer !== fork.attrs.steerer) {
    const h = headset.attrs.steerer, k = fork.attrs.steerer
    emit('error', 'headset-fork', ['headset', 'fork'], steererSize(h) === steererSize(k) && threaded(h) !== threaded(k)
      ? `${name(headset)} is a ${threaded(h) ? 'threaded' : 'threadless'} headset; ${name(fork)} has a ${threaded(k) ? 'threaded' : 'threadless'} steerer.`
      : `${name(headset)} is for ${h} steerers; ${name(fork)} is ${k}.`)
  }
  if (has(stem, 'steerer') && has(fork, 'steerer')) {
    const st = stem.attrs.steerer, k = fork.attrs.steerer
    if (steererTop(st) !== steererTop(k)) {
      emit('error', 'stem-steerer', ['stem', 'fork'], `${name(stem)} ${threaded(st) ? 'is a quill for' : 'clamps'} a ${steererTop(st)} steerer; the top of ${name(fork)}'s steerer is ${steererTop(k)}.`)
    } else if (threaded(st) && !threaded(k)) {
      emit('error', 'stem-steerer', ['stem', 'fork'], `${name(stem)} is a quill stem — it needs a threaded steerer, and ${name(fork)} is threadless.`)
    } else if (!threaded(st) && threaded(k)) {
      emit('warning', 'stem-steerer', ['stem', 'fork'], `${name(fork)} has a threaded steerer; ${name(stem)} is a threadless stem. It fits with a quill-to-threadless adapter (adds height and weight) — or use a quill stem.`)
    }
  }

  // ---------- Suspension ----------
  if (rearShock && has(frame, 'suspension') && frame.attrs.suspension !== 'Full Suspension') {
    emit('error', 'shock-frame', ['rearShock', 'frame'], `${name(frame)} is a ${frame.attrs.suspension.toLowerCase()} frame — it has nowhere to mount a rear shock.`)
  } else if (rearShock && frame) {
    if (has(rearShock, 'shockSize') && has(frame, 'shockSize') && rearShock.attrs.shockSize !== frame.attrs.shockSize) {
      emit('error', 'shock-size', ['rearShock', 'frame'], `${name(rearShock)} is ${rearShock.attrs.shockSize}mm, but ${name(frame)} takes a ${frame.attrs.shockSize}mm shock.`)
    }
    if (has(rearShock, 'shockMount') && has(frame, 'shockMount') && rearShock.attrs.shockMount !== frame.attrs.shockMount) {
      emit('error', 'shock-mount', ['rearShock', 'frame'], `${name(rearShock)} is ${rearShock.attrs.shockMount.toLowerCase()} mount; ${name(frame)} needs ${frame.attrs.shockMount.toLowerCase()} mount.`)
    }
  }
  if (!rearShock && frame?.attrs?.suspension === 'Full Suspension') {
    emit('note', 'shock-missing', ['frame', 'rearShock'], `${name(frame)} is full suspension. Most frames ship with a shock — only add one here if yours doesn't, or you're upgrading.`)
  }
  if (has(fork, 'travelMm') && has(frame, 'maxForkTravelMm')) {
    const travel = fork.attrs.travelMm, max = frame.attrs.maxForkTravelMm
    if (max === 0 && travel > 0) {
      emit('warning', 'fork-travel', ['fork', 'frame'], `${name(frame)} is designed for a rigid fork; a ${travel}mm suspension fork will raise the front end and may void the frame warranty.`)
    } else if (max > 0 && travel > max) {
      emit('warning', 'fork-travel', ['fork', 'frame'], `${name(fork)} has ${travel}mm of travel; ${name(frame)} is rated for up to ${max}mm. Expect slacker geometry and check the warranty.`)
    }
  }

  // ---------- Wheels ----------
  const rearSize = rear('wheelSize')
  const frontSize = front('wheelSize')
  if (rearSize && has(frame, 'wheelSizes') && !frame.attrs.wheelSizes.includes(rearSize[1].attrs!.wheelSize!)) {
    emit('error', 'wheel-frame', [rearSize[0], 'frame'], `${name(rearSize[1])} is ${formatWheelSize(rearSize[1].attrs!.wheelSize!)}; ${name(frame)} fits ${frame.attrs.wheelSizes.map(formatWheelSize).join(' or ')}.`)
  }
  if (frontSize && has(fork, 'wheelSizes') && !fork.attrs.wheelSizes.includes(frontSize[1].attrs!.wheelSize!)) {
    emit('error', 'wheel-fork', [frontSize[0], 'fork'], `${name(frontSize[1])} is ${formatWheelSize(frontSize[1].attrs!.wheelSize!)}; ${name(fork)} fits ${fork.attrs.wheelSizes.map(formatWheelSize).join(' or ')}.`)
  }
  if (frontSize && rearSize && frontSize[0] !== rearSize[0] && frontSize[1].attrs!.wheelSize !== rearSize[1].attrs!.wheelSize) {
    emit('note', 'mullet', [frontSize[0], rearSize[0]], `Mixed wheel sizes (${formatWheelSize(frontSize[1].attrs!.wheelSize!)} front, ${formatWheelSize(rearSize[1].attrs!.wheelSize!)} rear) — a "mullet" setup. Make sure your tires suit both.`)
  }

  const frontAxle = front('frontAxle')
  const slot9mm = (a: string) => a === 'QR 100mm' || a === '100mm Nutted'
  if (frontAxle && has(fork, 'frontAxle') && frontAxle[1].attrs!.frontAxle !== fork.attrs.frontAxle) {
    if (slot9mm(frontAxle[1].attrs!.frontAxle!) && slot9mm(fork.attrs.frontAxle)) {
      // Same 100mm, 9mm-slot dropout — only the clamping (QR skewer vs axle nuts) differs.
      emit('note', 'front-axle', [frontAxle[0], 'fork'], `${name(frontAxle[1])} is ${frontAxle[1].attrs!.frontAxle} and ${name(fork)} is ${fork.attrs.frontAxle} — same 9mm dropout, so it fits; just bring the right skewer or a wrench.`)
    } else emit('error', 'front-axle', [frontAxle[0], 'fork'], `${name(frontAxle[1])} has a ${frontAxle[1].attrs!.frontAxle} front axle, but ${name(fork)} is ${fork.attrs.frontAxle}.`)
  }
  const rearAxle = rear('rearAxle')
  if (rearAxle && has(frame, 'rearAxle') && rearAxle[1].attrs!.rearAxle !== frame.attrs.rearAxle) {
    const hub = rearAxle[1].attrs!.rearAxle!, dropouts = frame.attrs.rearAxle
    const qr = (a: string) => a.startsWith('QR ')
    if (frame.attrs.material === 'steel' && qr(hub) && qr(dropouts)) {
      // Steel frames flex a few mm, and can be permanently cold-set by a shop.
      emit('warning', 'rear-axle', [rearAxle[0], 'frame'], `${name(rearAxle[1])} is ${hub.slice(3)}; ${name(frame)} is spaced ${dropouts.slice(3)}. On steel you can spring it in or have the frame cold-set — or respace the hub.`)
    } else {
      emit('error', 'rear-axle', [rearAxle[0], 'frame'], `${name(rearAxle[1])} has a ${hub} rear axle, but ${name(frame)} is ${dropouts}.`)
    }
  }

  // ---------- Tires ----------
  if (has(tires, 'wheelSize')) {
    for (const w of [frontSize, rearSize]) {
      if (w && w[1].attrs!.wheelSize !== tires.attrs.wheelSize) {
        emit('error', 'tire-wheel', ['tires', w[0]], `${name(tires)} is a ${formatWheelSize(tires.attrs.wheelSize)} tire; ${name(w[1])} is ${formatWheelSize(w[1].attrs!.wheelSize!)}.`)
        break
      }
    }
  }
  if (has(tires, 'tireWidthMm')) {
    const width = tires.attrs.tireWidthMm
    for (const [cat, part] of [['frame', frame], ['fork', fork]] as const) {
      if (has(part, 'maxTireMm') && width > part.attrs.maxTireMm) {
        emit('error', `tire-clearance`, ['tires', cat], `${width}mm tires are wider than the ${part.attrs.maxTireMm}mm max clearance of ${name(part)}.`)
      }
    }
    const rim = rear('rimInternalMm') ?? front('rimInternalMm')
    if (rim) {
      const internal = rim[1].attrs!.rimInternalMm!
      if (width < internal * 1.1) {
        emit('warning', 'tire-rim', ['tires', rim[0]], `${width}mm tires are very narrow for a ${internal}mm internal rim. Check the rim maker's minimum tire width (especially for hookless rims).`)
      } else if (width > internal * 3.2) {
        emit('warning', 'tire-rim', ['tires', rim[0]], `${width}mm tires are very wide for a ${internal}mm internal rim — expect a squirmy, rounded profile.`)
      }
    }
    const tubelessRim = rear('tubeless')
    if (tires.attrs.tubeless === true && tubelessRim && tubelessRim[1].attrs!.tubeless === false) {
      emit('note', 'tubeless', ['tires', tubelessRim[0]], `${name(tubelessRim[1])} isn't tubeless-ready — run these tires with tubes.`)
    }
  }

  // ---------- Drivetrain: BB & crank ----------
  if (has(bottomBracket, 'bbShell') && has(frame, 'bbShell') && bottomBracket.attrs.bbShell !== frame.attrs.bbShell) {
    emit('error', 'bb-shell', ['bottomBracket', 'frame'], `${name(bottomBracket)} is for ${bottomBracket.attrs.bbShell} shells; ${name(frame)} has a ${frame.attrs.bbShell} shell.`)
  }
  if (has(bottomBracket, 'bbSpindle') && has(crankset, 'bbSpindle') && bottomBracket.attrs.bbSpindle !== crankset.attrs.bbSpindle) {
    emit('error', 'bb-spindle', ['bottomBracket', 'crankset'], `${name(crankset)} has a ${crankset.attrs.bbSpindle} spindle; ${name(bottomBracket)} takes ${bottomBracket.attrs.bbSpindle}.`)
  }
  if (crankset && !bottomBracket && has(frame, 'bbShell') && has(crankset, 'bbSpindle')) {
    emit('note', 'bb-missing', ['bottomBracket'], `You'll need a ${frame.attrs.bbShell} bottom bracket for a ${crankset.attrs.bbSpindle} spindle.`)
  }

  // ---------- Drivetrain: cogs, freehub ----------
  const freehub = rear('freehub')
  if (has(cassette, 'freehub') && freehub) {
    const fit = freehubFit(cassette.attrs.freehub, freehub[1].attrs!.freehub!)
    if (fit) {
      emit(fit.severity, 'freehub', ['cassette', freehub[0]],
        fit.severity === 'error'
          ? `${name(cassette)} needs a ${cassette.attrs.freehub} freehub; ${name(freehub[1])} has ${freehub[1].attrs!.freehub}.`
          : `${name(cassette)} on a ${freehub[1].attrs!.freehub} freehub ${fit.how}.`)
    }
  }
  if (has(sprocket, 'freehub') && freehub && sprocket.attrs.freehub !== freehub[1].attrs!.freehub) {
    const cog = sprocket.attrs.freehub, hub = freehub[1].attrs!.freehub!
    if (cog === 'Thread-on Freewheel' && hub === 'Track Fixed') {
      emit('note', 'sprocket-freehub', ['sprocket', freehub[0]], `${name(sprocket)} threads onto ${name(freehub[1])}'s fixed-gear threads fine — it just won't use the lockring.`)
    } else if (cog === 'Track Fixed' && hub === 'Thread-on Freewheel') {
      emit('warning', 'sprocket-freehub', ['sprocket', freehub[0]], `${name(sprocket)} is a fixed cog, but ${name(freehub[1])} has freewheel threads with no lockring — the cog can unscrew under back-pressure. Use a track hub.`)
    } else {
      emit('error', 'sprocket-freehub', ['sprocket', freehub[0]], `${name(sprocket)} fits ${cog} hubs; ${name(freehub[1])} has ${hub}.`)
    }
  }
  if (cassette && sprocket) {
    emit('warning', 'cassette-and-sprocket', ['cassette', 'sprocket'], `You've chosen both a cassette and a single-speed cog — a bike runs one or the other.`)
  }
  if (frame?.attrs?.derailleurHanger === false) {
    if (rearDerailleur) emit('error', 'no-hanger', ['rearDerailleur', 'frame'], `${name(frame)} has no derailleur hanger — it's a single-speed/track frame.`)
    else if (cassette && (cassette.attrs?.speeds ?? 2) > 1) emit('warning', 'no-hanger', ['cassette', 'frame'], `${name(frame)} has no derailleur hanger, so a multi-speed cassette can't be shifted. Use a single-speed cog.`)
  }
  if (rearDerailleur?.attrs?.udhRequired && frame?.attrs?.udh === false) {
    emit('error', 'udh', ['rearDerailleur', 'frame'], `${name(rearDerailleur)} mounts directly to a UDH (Universal Derailleur Hanger); ${name(frame)} doesn't have one.`)
  }

  // ---------- Drivetrain: speeds & shift systems ----------
  // Friction shifters work at any speed, so they don't take part in the speed check.
  const speedParts = ([['cassette', cassette], ['shifters', shifters], ['chain', chain], ['rearDerailleur', rearDerailleur]] as const)
    .filter(([, part]) => has(part, 'speeds') && part!.attrs!.speeds! > 1 && part!.attrs!.shiftSystem !== 'Friction') as Array<[PartCategory, Part]>
  if (speedParts.length > 1) {
    const drive = speedParts[0][1].attrs!.speeds!
    if (speedParts.some(([c, part]) => !speedsCompatible(c, part.attrs!.speeds!, drive))) {
      const detail = speedParts.map(([c, part]) => `${getCategoryLabel(c)} ${part.attrs!.speeds}s`).join(', ')
      emit('error', 'speeds', speedParts.map(([c]) => c), `Mixed drivetrain speeds (${detail}). Cassette, chain, derailleur and shifters must all be the same speed.`)
    }
  }
  if (has(crankset, 'speeds') && crankset.attrs.speeds > 1 && speedParts.length > 0) {
    const drive = speedParts[0][1].attrs!.speeds!
    if (crankset.attrs.speeds !== drive) {
      emit('warning', 'crank-speeds', ['crankset', speedParts[0][0]], `${name(crankset)} is designed for ${crankset.attrs.speeds}-speed; the rest of the drivetrain is ${drive}-speed. Shifting and chain fit may suffer.`)
    }
  }
  if (has(shifters, 'shiftSystem') && has(rearDerailleur, 'shiftSystem') && !shiftCompatible(shifters, rearDerailleur)) {
    emit('error', 'shift-system', ['shifters', 'rearDerailleur'], `${name(shifters)} (${shifters.attrs.shiftSystem}) can't control ${name(rearDerailleur)} (${rearDerailleur.attrs.shiftSystem}).`)
  }
  if (has(cassette, 'largestCogT') && has(rearDerailleur, 'maxCogT') && cassette.attrs.largestCogT > rearDerailleur.attrs.maxCogT) {
    emit('error', 'max-cog', ['cassette', 'rearDerailleur'], `${name(cassette)}'s ${cassette.attrs.largestCogT}T cog is bigger than the ${rearDerailleur.attrs.maxCogT}T max of ${name(rearDerailleur)}.`)
  }
  if (chain?.attrs?.flattop === false && cassette?.attrs?.freehub === 'SRAM XDR' && cassette.attrs.speeds === 12) {
    emit('warning', 'flattop', ['chain', 'cassette'], `SRAM 12-speed road (XDR) drivetrains are designed for a Flattop chain; ${name(chain)} isn't one.`)
  } else if (chain?.attrs?.flattop === true && cassette && cassette.brand !== 'SRAM') {
    // Flattop (road AXS, Transmission T-Type, Apex Eagle) is designed around SRAM's own cassettes.
    emit('warning', 'flattop', ['chain', 'cassette'], `${name(chain)} is a SRAM Flattop chain, made for SRAM 12/13-speed cassettes — not ${name(cassette)}.`)
  }

  // ---------- Drivetrain: front derailleur ----------
  if (has(crankset, 'chainringCount')) {
    const rings = crankset.attrs.chainringCount
    if (rings >= 2 && frame?.attrs?.frontDerailleurMount === 'None') {
      emit('error', 'fd-frame', ['crankset', 'frame'], `${name(crankset)} is a ${rings}x crank, but ${name(frame)} is 1x-only (no front derailleur mount).`)
    } else if (rings >= 2 && !frontDerailleur) {
      emit('note', 'fd-missing', ['crankset', 'frontDerailleur'], `${name(crankset)} is a ${rings}x crank — you'll need a front derailleur.`)
    } else if (rings === 1 && frontDerailleur) {
      emit('warning', 'fd-1x', ['frontDerailleur', 'crankset'], `${name(crankset)} is a 1x crank, so the front derailleur won't do anything.`)
    }
  }
  if (has(frontDerailleur, 'frontDerailleurMount') && has(frame, 'frontDerailleurMount') && frame.attrs.frontDerailleurMount !== 'None' && frontDerailleur.attrs.frontDerailleurMount !== frame.attrs.frontDerailleurMount) {
    // A braze-on FD on a round seat tube just needs the common band-clamp adapter.
    const bandAdapter = frontDerailleur.attrs.frontDerailleurMount === 'Braze-on' && frame.attrs.frontDerailleurMount === 'Clamp'
    emit(bandAdapter ? 'note' : 'warning', 'fd-mount', ['frontDerailleur', 'frame'], `${name(frontDerailleur)} is ${frontDerailleur.attrs.frontDerailleurMount.toLowerCase()} mount; ${name(frame)} is ${frame.attrs.frontDerailleurMount.toLowerCase()}. You'll need an adapter clamp.`)
  }

  // ---------- Brakes ----------
  if (has(brakes, 'brakeMount')) {
    const need = brakes.attrs.brakeMount
    const isDisc = (m: string) => m === 'Flat Mount' || m === 'Post Mount' || m === 'IS Disc'
    const bosses = (m: string) => m === 'V-Brake/Cantilever' || m === 'U-Brake'
    for (const [cat, part] of [['frame', frame], ['fork', fork]] as const) {
      if (!has(part, 'brakeMount')) continue
      const got = part.attrs.brakeMount
      if (got === need) {
        if (need === 'Rim Caliper' && has(part, 'brakeReachMm') && has(brakes, 'reachMinMm') && has(brakes, 'reachMaxMm')) {
          const reach = part.attrs.brakeReachMm, lo = brakes.attrs.reachMinMm, hi = brakes.attrs.reachMaxMm
          if (reach < lo || reach > hi) {
            emit('error', 'brake-reach', ['brakes', cat], `${name(part)} needs ${reach}mm of brake reach; ${name(brakes)} cover ${lo}–${hi}mm. Look for ${reach > hi ? 'long-reach' : 'short-reach'} calipers.`)
          }
        }
        continue
      }
      // BMX U-brakes are rear-only; a brakeless fork is normal.
      if (need === 'U-Brake' && cat === 'fork' && got === 'None') continue
      if (bosses(need) && bosses(got)) {
        // Mid-80s MTBs: cantis up front, a U-brake / roller cam under the chainstay.
        emit('warning', 'brake-mount', ['brakes', cat], `${name(part)} has ${got === 'U-Brake' ? 'U-brake / roller-cam' : 'cantilever'} bosses, but ${name(brakes)} are for ${need === 'U-Brake' ? 'U-brake / roller-cam' : 'cantilever / V-brake'} bosses. You'll need a matching ${cat === 'frame' ? 'rear' : 'front'} brake — add it as a custom part.`)
      } else if (got === 'None') {
        emit('error', 'brake-mount', ['brakes', cat], `${name(part)} has no brake mounts.`)
      } else if (isDisc(got) && isDisc(need)) {
        emit('warning', 'brake-mount', ['brakes', cat], `${name(brakes)} are for ${need} mounts; ${name(part)} has ${got} mounts. You'll need a mount adapter.`)
      } else {
        emit('error', 'brake-mount', ['brakes', cat], `${name(brakes)} need ${need} mounts; ${name(part)} has ${got}.`)
      }
    }
  }
  const rotorHub = rear('rotorInterface') ?? front('rotorInterface')
  if (has(brakes, 'brakeType') && rotorHub) {
    const disc = brakes.attrs.brakeType.endsWith('Disc')
    const hubIface = rotorHub[1].attrs!.rotorInterface!
    if (disc && hubIface === 'Rim Brake') {
      emit('error', 'brake-wheel', ['brakes', rotorHub[0]], `${name(brakes)} are disc brakes, but ${name(rotorHub[1])} is a rim-brake wheel with no rotor mount.`)
    } else if (!disc && hubIface !== 'Rim Brake') {
      emit('error', 'brake-wheel', ['brakes', rotorHub[0]], `${name(brakes)} are rim brakes, but ${name(rotorHub[1])} is a disc-specific wheel with no brake track.`)
    }
  }
  if (rotors) {
    if (brakes?.attrs?.brakeType && !brakes.attrs.brakeType.endsWith('Disc')) {
      emit('warning', 'rotor-rim', ['rotors', 'brakes'], `Rotors only work with disc brakes; ${name(brakes)} are rim brakes.`)
    }
    if (has(rotors, 'rotorInterface') && rotorHub && rotorHub[1].attrs!.rotorInterface !== 'Rim Brake') {
      const hubIface = rotorHub[1].attrs!.rotorInterface
      if (rotors.attrs.rotorInterface === 'Center Lock' && hubIface === '6-Bolt') {
        emit('error', 'rotor-mount', ['rotors', rotorHub[0]], `${name(rotors)} are Center Lock; ${name(rotorHub[1])} has 6-bolt hubs.`)
      } else if (rotors.attrs.rotorInterface === '6-Bolt' && hubIface === 'Center Lock') {
        emit('warning', 'rotor-mount', ['rotors', rotorHub[0]], `${name(rotors)} are 6-bolt; ${name(rotorHub[1])} has Center Lock hubs. You'll need a Center Lock adapter.`)
      }
    }
    if (has(rotors, 'rotorSizeMm')) {
      for (const [cat, part] of [['frame', frame], ['fork', fork]] as const) {
        if (has(part, 'maxRotorMm') && rotors.attrs.rotorSizeMm > part.attrs.maxRotorMm) {
          emit('warning', 'rotor-size', ['rotors', cat], `${rotors.attrs.rotorSizeMm}mm rotors are bigger than the ${part.attrs.maxRotorMm}mm max for ${name(part)}.`)
        }
      }
    }
  } else if (brakes?.attrs?.brakeType?.endsWith('Disc') && rotorHub && rotorHub[1].attrs!.rotorInterface !== 'Rim Brake') {
    emit('note', 'rotor-missing', ['rotors'], `Disc brakes usually don't include rotors — add ${rotorHub[1].attrs!.rotorInterface} rotors.`)
  }

  // ---------- Levers & cockpit ----------
  // Brake levers come from the Brake Levers slot, from brake-lever shifters (STI, Ergopower…),
  // or are bundled with the brakes (most flat-bar hydraulics).
  const leverSources = ([['brakeLevers', brakeLevers], ['shifters', shifters]] as const)
    .filter(([, part]) => has(part, 'brakeType')) as Array<[PartCategory, Part]>
  const bundled = brakes?.attrs?.includesLevers === true
  if (bundled && leverSources.length > 0) {
    emit('warning', 'double-levers', ['brakes', leverSources[0][0]], `${name(brakes!)} come with their own levers, and ${name(leverSources[0][1])} ${leverSources[0][0] === 'shifters' ? 'have brake levers built in' : 'are brake levers too'}.`)
  } else if (leverSources.length > 1) {
    emit('note', 'double-levers', ['brakeLevers', 'shifters'], `${name(shifters!)} already have brake levers — ${name(brakeLevers!)} only make sense as interrupter / cross-top levers.`)
  }
  const lever = bundled ? undefined : leverSources[0]
  if (lever && has(brakes, 'brakeType')) {
    const [lcat, lpart] = lever
    const l = lpart.attrs!.brakeType!, caliper = brakes.attrs.brakeType
    if (hydraulic(l) !== hydraulic(caliper)) {
      emit('error', 'lever-brake', [lcat, 'brakes'], hydraulic(l)
        ? `${name(lpart)} are hydraulic levers; ${name(brakes)} are cable-actuated.`
        : `${name(lpart)} are cable levers; ${name(brakes)} are hydraulic.`)
    } else if (hydraulic(l) && l !== caliper) {
      emit('error', 'lever-brake', [lcat, 'brakes'], `${name(lpart)} are ${l.toLowerCase()} levers; ${name(brakes)} are ${caliper.toLowerCase()} — different hydraulic systems.`)
    } else if (!hydraulic(l) && has(lpart, 'cablePull') && has(brakes, 'cablePull') && lpart.attrs.cablePull !== brakes.attrs.cablePull) {
      emit('error', 'cable-pull', [lcat, 'brakes'], lpart.attrs.cablePull === 'Short'
        ? `${name(lpart)} are short-pull levers; ${name(brakes)} need long pull. They'll feel spongy and bottom out — use long-pull levers or a travel adapter (e.g. a Travel Agent).`
        : `${name(lpart)} are long-pull (V-brake) levers; ${name(brakes)} need short pull. Expect weak braking — use short-pull levers.`)
    }
  }
  if (has(brakes, 'brakeType') && !bundled && !lever) {
    emit('note', 'levers-missing', ['brakeLevers', 'brakes'], `${name(brakes)} don't include levers, and your shifters don't have any — add brake levers${brakes.attrs.cablePull ? ` (${brakes.attrs.cablePull.toLowerCase()} pull)` : ''}.`)
  }
  for (const [cat, part] of [['shifters', shifters], ['brakeLevers', brakeLevers]] as const) {
    if (!has(part, 'handlebarType') || !has(handlebars, 'handlebarType')) continue
    if (cat === 'shifters' && (part.attrs.shifterMount === 'Downtube' || part.attrs.shifterMount === 'Stem')) continue
    const roadLevers = roadBar(part.attrs.handlebarType), road = roadBar(handlebars.attrs.handlebarType)
    if (roadLevers !== road) {
      const what = cat === 'shifters' ? (part.attrs.shifterMount === 'Bar-End' ? 'bar-end shifters' : roadLevers ? 'drop-bar levers' : 'flat-bar shifters') : roadLevers ? 'road (23.8mm) levers' : 'flat-bar (22.2mm) levers'
      emit('error', 'lever-bar', [cat, 'handlebars'], `${name(part)} are ${what}; ${name(handlebars)} is a ${handlebars.attrs.handlebarType.toLowerCase()} bar${road ? ' with a 23.8mm grip area' : ' with 22.2mm grips'}.`)
    }
  }
  if (shifters?.attrs?.shifterMount === 'Downtube' && frame?.attrs?.downtubeBosses === false) {
    emit('warning', 'downtube-bosses', ['shifters', 'frame'], `${name(frame)} has no downtube shifter bosses — ${name(shifters)} will need a band-on clamp.`)
  }
  if (handlebars?.attrs?.handlebarType === 'Integrated Drop' && stem) {
    emit('warning', 'integrated-cockpit', ['handlebars', 'stem'], `${name(handlebars)} is a one-piece bar/stem — you don't need a separate stem.`)
  } else if (has(handlebars, 'barClampMm') && has(stem, 'barClampMm') && handlebars.attrs.barClampMm !== stem.attrs.barClampMm) {
    const bar = handlebars.attrs.barClampMm, clamp = stem.attrs.barClampMm
    if (Math.abs(bar - clamp) <= 0.4) {
      emit('note', 'bar-clamp', ['handlebars', 'stem'], `${name(handlebars)} is ${bar}mm and ${name(stem)} clamps ${clamp}mm — close enough to work, but check it clamps up without creaking.`)
    } else if (bar < clamp) {
      emit('warning', 'bar-clamp', ['handlebars', 'stem'], `${name(handlebars)} is ${bar}mm at the clamp; ${name(stem)} clamps ${clamp}mm. Works with a shim, but a matching stem is better.`)
    } else {
      emit('error', 'bar-clamp', ['handlebars', 'stem'], `${name(handlebars)} is ${bar}mm at the clamp — too big for ${name(stem)}'s ${clamp}mm clamp.`)
    }
  }

  // ---------- Seatpost ----------
  if (has(seatpost, 'seatpostMm') && has(frame, 'seatpostMm') && seatpost.attrs.seatpostMm !== frame.attrs.seatpostMm) {
    const post = seatpost.attrs.seatpostMm, tube = frame.attrs.seatpostMm
    if (post < tube) {
      emit('warning', 'seatpost', ['seatpost', 'frame'], `${name(seatpost)} is ${post}mm; ${name(frame)} takes ${tube}mm. You'll need a ${post}→${tube} shim.`)
    } else {
      emit('error', 'seatpost', ['seatpost', 'frame'], `${name(seatpost)} is ${post}mm — too big for ${name(frame)}'s ${tube}mm seat tube.`)
    }
  }
}

function dedupe(issues: CompatIssue[]): CompatIssue[] {
  const seen = new Set<string>()
  return issues.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = { error: 0, warning: 1, note: 2 }

/** All compatibility issues for a build, errors first. */
export function checkBuild(build: Build): CompatIssue[] {
  const issues: CompatIssue[] = []
  runRules(collectParts(build), (severity, rule, categories, message) => {
    issues.push({ id: `${rule}:${categories.join('+')}`, severity, message, categories })
  })
  return dedupe(issues).sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

/**
 * Issues that would involve `part` if it were put into its slot in `build` — powers
 * the browse page's compatibility filter and per-row badges. Ignores issues that
 * don't involve this part's category (they exist with or without it), and "missing
 * part" notes.
 */
export function checkPartAgainstBuild(part: Part, build: Build, slotCategory: PartCategory = part.category): CompatIssue[] {
  const components: ComponentSlot[] = build.components.some((s) => s.category === slotCategory)
    ? build.components.map((s) => (s.category === slotCategory ? { ...s, part } : s))
    : [...build.components, { category: slotCategory, part }]
  return checkBuild({ ...build, components }).filter(
    (i) => i.categories.includes(slotCategory) && !i.id.includes('-missing'),
  )
}

export function worstSeverity(issues: CompatIssue[]): IssueSeverity | undefined {
  return issues[0] ? issues.reduce<IssueSeverity>((w, i) => (SEVERITY_ORDER[i.severity] < SEVERITY_ORDER[w] ? i.severity : w), 'note') : undefined
}

export interface WeightEstimate {
  grams: number
  /** Selected parts with no known weight (estimate is then a lower bound). */
  unknown: number
  formatted: string
}

/** Sum of claimed part weights × quantity — the bike's answer to estimated wattage. */
export function estimateWeight(build: Build): WeightEstimate {
  let grams = 0
  let unknown = 0
  for (const slot of build.components) {
    if (!slot.part) continue
    const w = resolvePart(slot.part).weightG
    if (w == null) unknown++
    else grams += w * slotQuantity(slot)
  }
  return { grams, unknown, formatted: formatWeight(grams) }
}
