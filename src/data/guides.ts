import type { Build, BuildGuide, ComponentSlot } from '@/types/build'
import type { PartCategory } from '@/types/parts'
import { ALL_CATEGORIES, defaultQuantity } from '@/data/categoryConfig'
import { getPartById } from '@/data/partsDatabase'

/**
 * Curated Build Guides (PCPartPicker's /guide/). Every part references a catalog id
 * in src/data/parts/*.json, so prices, weights and compatibility are always live.
 * Check them with `node .context/tools/run-ts.mjs .context/tools/check-guides.ts`
 * — every guide should come back with 0 errors and 0 warnings.
 *
 * Array order matters: the home page features the first three.
 */

export type GuideDiscipline = 'road' | 'gravel' | 'xc' | 'trail' | 'track' | 'bmx' | 'urban' | 'touring' | 'vintage'

/** Display order + labels for grouping guides on /guides. */
export const GUIDE_DISCIPLINES: { id: GuideDiscipline; label: string }[] = [
  { id: 'road', label: 'Road' },
  { id: 'gravel', label: 'Gravel' },
  { id: 'xc', label: 'XC Mountain' },
  { id: 'trail', label: 'Trail / Enduro' },
  { id: 'track', label: 'Track / Fixed' },
  { id: 'bmx', label: 'BMX' },
  { id: 'urban', label: 'Urban / Commuter' },
  { id: 'touring', label: 'Touring / Alt' },
  { id: 'vintage', label: 'Vintage MTB' },
]

export const GUIDE_TIERS: { id: BuildGuide['tier']; label: string }[] = [
  { id: 'entry', label: 'Entry-Level' },
  { id: 'mid', label: 'Mid-Range' },
  { id: 'enthusiast', label: 'Enthusiast' },
  { id: 'dream', label: 'Dream' },
]

export function tierLabel(tier: BuildGuide['tier']): string {
  return GUIDE_TIERS.find((t) => t.id === tier)?.label ?? tier
}

const DEV = import.meta.env?.DEV ?? true
const ORDER = new Map(ALL_CATEGORIES.map((c, i) => [c.id, i]))

/** A builder slot holding catalog part `id`. Tires/rotors default to quantity 2. */
function slot(category: PartCategory, id: string, quantity = defaultQuantity(category)): ComponentSlot | null {
  const part = getPartById(id)
  if (!part) {
    const msg = `[guides] unknown catalog part id "${id}" (${category})`
    if (DEV) throw new Error(msg)
    console.error(msg)
    return null
  }
  return quantity === 1 ? { category, part } : { category, part, quantity }
}

const disciplineById = new Map<string, GuideDiscipline>()

interface GuideInput {
  id: string
  discipline: GuideDiscipline
  tier: BuildGuide['tier']
  title: string
  summary: string
  /** Paragraphs separated by blank lines. */
  body: string
  /** Build name shown in the part list / builder. Defaults to the title. */
  buildName?: string
  parts: Array<ComponentSlot | null>
  extras?: Array<{ name: string; price?: number; notes?: string }>
}

function guide(g: GuideInput): BuildGuide {
  disciplineById.set(g.id, g.discipline)
  const components = g.parts
    .filter((s): s is ComponentSlot => s !== null)
    .sort((a, b) => (ORDER.get(a.category) ?? 99) - (ORDER.get(b.category) ?? 99))
  const build: Build = {
    name: g.buildName ?? g.title,
    description: g.summary,
    ownerName: 'Pedal Parts Picker',
    createdAt: '2026-09-01T12:00:00Z',
    components,
  }
  if (g.extras?.length) {
    build.additionalItems = g.extras.map((e, i) => ({ id: `${g.id}-extra-${i + 1}`, ...e }))
  }
  return { id: g.id, title: g.title, summary: g.summary, body: g.body.trim().replace(/\n[ \t]+/g, '\n'), tier: g.tier, build }
}

export const BUILD_GUIDES: BuildGuide[] = [
  guide({
    id: 'mid-gravel',
    discipline: 'gravel',
    tier: 'mid',
    title: 'Mid-Range Gravel Build',
    summary: 'Carbon Niner RLT with Shimano GRX 1x12 and a 10-51 mountain cassette — goes anywhere, fixes easily.',
    body: `
      The Niner RLT 9 RDO is the sweet spot of carbon gravel frames: 50mm of tire clearance, 180mm rotor
      support and mounts everywhere. Pair it with Salsa's Firestarter fork and you can run genuinely fat
      rubber; we went with 42mm Teravail Rutlands, which roll fast on hardpack and still hook up on chunk.

      The drivetrain is Shimano GRX RX820 in its 1x12 form. Because GRX 12-speed shares its cable pull with
      Shimano's MTB groups, the RX822 derailleur runs a 10-51 SLX cassette — a 40T ring gives you a
      sub-1:1 climbing gear without a front derailleur to clog. That needs a Microspline freehub, which is
      why the DT Swiss GR 1600 wheelset is here: tough, tubeless-ready and easy to service.

      Compromises: the jumps between gears are bigger than a 2x road setup, and the wheels are aluminium.
      First upgrade is a carbon wheelset with a Microspline driver; after that, a dropper post if your
      rides lean technical.`,
    parts: [
      slot('frame', 'niner-rlt-9-rdo'),
      slot('fork', 'salsa-firestarter-carbon'),
      slot('headset', 'cane-creek-40-is42-is52'),
      slot('wheels', 'dt-swiss-gr-1600-spline-25'),
      slot('tires', 'teravail-rutland'),
      slot('crankset', 'shimano-grx-rx820-1-crankset'),
      slot('bottomBracket', 'shimano-bb-rs500-pb'),
      slot('chain', 'shimano-cn-m7100'),
      slot('cassette', 'shimano-slx-m7100-cassette'),
      slot('rearDerailleur', 'shimano-grx-rd-rx822-sgs'),
      slot('shifters', 'shimano-grx-st-rx820'),
      slot('brakes', 'shimano-grx-rx810-brakes'),
      slot('rotors', 'shimano-rt-cl800-160'),
      slot('handlebars', 'salsa-cowchipper'),
      slot('stem', 'salsa-guide-deluxe-stem'),
      slot('seatpost', 'ritchey-wcs-carbon-link-flexlogic'),
      slot('saddle', 'fizik-terra-argo-x3'),
      slot('pedals', 'crankbrothers-candy-3'),
    ],
  }),

  guide({
    id: 'dream-road',
    discipline: 'road',
    tier: 'dream',
    title: 'Dream Road Build',
    summary: 'S-Works Aethos, Dura-Ace Di2 and Roval Alpinist wheels — a sub-6.5kg climbing weapon with no compromises.',
    body: `
      The S-Works Aethos is built for one thing: feeling fast going uphill. At under 600g it's the lightest
      frame in our catalog, and unlike most superlight frames it keeps a threaded BSA bottom bracket — quiet,
      easy to service and a perfect match for Dura-Ace's 24mm spindle.

      Dura-Ace R9200 Di2 is the benchmark road groupset: crisp semi-wireless shifting, a 52/36 crank and an
      11-30 cassette for proper racing gears, plus the best hydraulic brakes Shimano makes. Roval's Alpinist
      CLX II wheels are shallow, light and stiff; 28mm GP5000 S TRs set up tubeless are as fast as tires get.

      The cockpit and post are ENVE carbon and the saddle is the S-Works Power. If anything, this build is
      about where to stop — the only meaningful upgrade left is a power meter (swap the pedals for Garmin
      Rally RS200s) and a bike fit.`,
    parts: [
      slot('frame', 'specialized-s-works-aethos'),
      slot('fork', 'enve-ses-road-fork'),
      slot('headset', 'hope-integrated-is41-is52'),
      slot('wheels', 'roval-alpinist-clx-ii'),
      slot('tires', 'continental-gp5000-s-tr'),
      slot('crankset', 'shimano-dura-ace-r9200-crankset'),
      slot('bottomBracket', 'shimano-bb-r9100'),
      slot('chain', 'shimano-dura-ace-cn-m9100'),
      slot('cassette', 'shimano-dura-ace-r9200-cassette'),
      slot('rearDerailleur', 'shimano-dura-ace-rd-r9250'),
      slot('frontDerailleur', 'shimano-dura-ace-fd-r9250'),
      slot('shifters', 'shimano-dura-ace-st-r9270'),
      slot('brakes', 'shimano-dura-ace-r9270'),
      slot('rotors', 'shimano-rt-cl900-160'),
      slot('handlebars', 'enve-ses-ar-road-bar'),
      slot('stem', 'enve-stem'),
      slot('seatpost', 'enve-carbon-seatpost'),
      slot('saddle', 'specialized-s-works-power'),
      slot('pedals', 'shimano-dura-ace-pd-r9100'),
    ],
  }),

  guide({
    id: 'mid-trail',
    discipline: 'trail',
    tier: 'mid',
    title: 'Mid-Range Trail Build',
    summary: 'Yeti SB130 on a Pike and DPX2, SRAM GX Eagle and Industry Nine Hydra wheels — the do-everything 29er.',
    body: `
      The Yeti SB130 is the definition of a trail bike: 130mm of Switch Infinity rear travel that pedals
      like a cross-country bike and a 150mm-rated front end. The frame ships with a Fox Float DPX2, so the
      rear shock slot stays empty; up front we've fitted a 140mm RockShox Pike Ultimate for a slightly
      quicker front end. It takes a standard-mount 210x55 shock if you later want to try coil.

      SRAM GX Eagle mechanical is the value pick in 12-speed: the same 10-52 range as the expensive groups,
      a DUB crank on a threaded BB, and easy cable maintenance. SRAM G2 RSC four-piston brakes with 200mm
      HS2 rotors give real stopping power for a trail bike. Industry Nine's Hydra hubs on 30mm rims are the
      flashy part of this build — you'll hear the 690 points of engagement coming.

      Want to save money? Swap the Hydras for DT Swiss M 1900s (with an HG-driver cassette) and put the
      difference into suspension service. Want to go faster? The next step is a coil shock and Maxxis
      Assegai front tire.`,
    parts: [
      slot('frame', 'yeti-sb130'),
      slot('fork', 'rockshox-pike-ultimate'),
      slot('headset', 'cane-creek-40-zs44-zs56'),
      slot('wheels', 'industry-nine-hydra'),
      slot('tires', 'maxxis-minion-dhr-ii'),
      slot('crankset', 'sram-gx-eagle'),
      slot('bottomBracket', 'sram-dub-bb'),
      slot('chain', 'sram-gx-eagle-chain'),
      slot('cassette', 'sram-gx-eagle-xg-1275'),
      slot('rearDerailleur', 'sram-gx-eagle-rd'),
      slot('shifters', 'sram-gx-eagle-trigger'),
      slot('brakes', 'sram-g2-rsc'),
      slot('rotors', 'sram-hs2-200-6b'),
      slot('handlebars', 'renthal-fatbar-lite'),
      slot('stem', 'renthal-apex-stem'),
      slot('seatpost', 'fox-transfer-factory'),
      slot('saddle', 'wtb-silverado-team'),
      slot('pedals', 'crankbrothers-stamp-7'),
    ],
  }),

  guide({
    id: 'entry-road',
    discipline: 'road',
    tier: 'entry',
    title: 'Entry-Level Road Build',
    summary: 'Trek Émonda SL carbon with full Shimano 105 mechanical 12-speed and hydraulic discs.',
    body: `
      An entry-level road build should be one you never need to replace — just upgrade. The Trek Émonda
      SL 6 Disc is a light carbon race frame with 12mm thru-axles, flat-mount disc brakes and a BB86
      press-fit shell that takes Shimano's 24mm cranks with a $30 bottom bracket.

      Shimano 105 R7100 mechanical is the best value in road cycling: 12 speeds, a 50/34 compact crank and
      an 11-34 cassette that make hills friendly, and hydraulic disc brakes that are the same feel as
      Ultegra. Fulcrum Racing 5 DB wheels are tubeless-ready and tough; 28mm GP5000s are the maximum
      the Émonda clears, and the right width for its 19mm rims.

      Compromises: aluminium wheels and an aluminium cockpit add weight, and the Émonda's 28mm clearance
      rules out gravel adventures. Upgrade the wheels first — a carbon set like Shimano's Ultegra C36
      drops 200g of rotating weight and is the single most noticeable change you can make.`,
    parts: [
      slot('frame', 'trek-emonda-sl6-disc'),
      slot('fork', 'trek-oclv-fork'),
      slot('headset', 'fsa-no42-acb'),
      slot('wheels', 'fulcrum-racing-5-db'),
      slot('tires', 'continental-gp5000-s-tr'),
      slot('crankset', 'shimano-105-r7100-crankset'),
      slot('bottomBracket', 'shimano-bb-rs500-pb'),
      slot('chain', 'shimano-cn-m7100'),
      slot('cassette', 'shimano-105-r7100-cassette'),
      slot('rearDerailleur', 'shimano-105-rd-r7100'),
      slot('frontDerailleur', 'shimano-105-fd-r7100'),
      slot('shifters', 'shimano-105-st-r7120'),
      slot('brakes', 'shimano-105-r7170'),
      slot('rotors', 'shimano-sm-rt70-160'),
      slot('handlebars', 'ritchey-comp-curve'),
      slot('stem', 'ritchey-wcs-c220'),
      slot('seatpost', 'ritchey-comp-2-bolt'),
      slot('saddle', 'fizik-tempo-argo-r3'),
      slot('pedals', 'shimano-105-pd-r7000'),
    ],
  }),

  guide({
    id: 'mid-road',
    discipline: 'road',
    tier: 'mid',
    title: 'Mid-Range Road Build',
    summary: 'Mason Definition alloy, Shimano 105 Di2 and Ultegra C36 carbon wheels — electronic shifting on a sensible budget.',
    body: `
      The Mason Definition is a hand-finished aluminium frame that rides like good steel and has room for
      35mm tires — perfect for real-world roads. It uses a threaded BSA bottom bracket and a ZS44/ZS56
      headset, both of which are cheap and easy to replace.

      Shimano 105 Di2 brings electronic shifting to a mid-range price: the same semi-wireless system as
      Dura-Ace, with an 11-34 cassette and a 36T-capable derailleur. Ultegra C36 carbon wheels are the
      upgrade most entry builds wish they'd started with; 30mm Schwalbe Pro Ones fill out their 21mm rims
      nicely and are inside the ENVE fork's 31mm limit.

      What to upgrade first: a carbon bar and a lighter saddle are cheap gains. Swapping the 105 crank for
      Ultegra saves 40g; we'd rather spend that money on a power meter.`,
    parts: [
      slot('frame', 'mason-definition'),
      slot('fork', 'enve-ses-road-fork'),
      slot('headset', 'cane-creek-40-zs44-zs56'),
      slot('wheels', 'shimano-ultegra-wh-r8170-c36'),
      slot('tires', 'schwalbe-pro-one'),
      slot('crankset', 'shimano-105-r7100-crankset'),
      slot('bottomBracket', 'shimano-bb-r9100'),
      slot('chain', 'shimano-cn-m7100'),
      slot('cassette', 'shimano-105-r7100-cassette'),
      slot('rearDerailleur', 'shimano-105-rd-r7150'),
      slot('frontDerailleur', 'shimano-105-fd-r7150'),
      slot('shifters', 'shimano-105-st-r7170'),
      slot('brakes', 'shimano-105-r7170'),
      slot('rotors', 'shimano-rt-cl800-160'),
      slot('handlebars', 'zipp-service-course-80'),
      slot('stem', 'zipp-service-course-sl-stem'),
      slot('seatpost', 'thomson-elite-setback'),
      slot('saddle', 'prologo-scratch-m5-pas'),
      slot('pedals', 'shimano-105-pd-r7000'),
    ],
  }),

  guide({
    id: 'enthusiast-road',
    discipline: 'road',
    tier: 'enthusiast',
    title: 'Enthusiast Road Race Build',
    summary: 'Tarmac SL7 with SRAM Force AXS and Zipp 303 Firecrest — a race bike that can do it all.',
    body: `
      The Tarmac SL7 is Specialized's do-everything race frame: aero enough for crits, light enough for
      climbing, with a threaded BSA shell and room for 32mm tires. It uses an IS41/IS52 integrated headset,
      so make sure you buy the right bearings.

      SRAM Force AXS is fully wireless — no cables to route through the bars — and its 48/35 crank with a
      10-33 cassette gives a gear range similar to a 52/36 with an 11-30. AXS road cassettes need an XDR
      freehub, which the Zipp 303 Firecrests have out of the box. Their 25mm internal rims want at least a
      28mm tire; Pirelli P Zero Race 28s measure up nicely.

      If you climb a lot, swap the cassette for a 10-36 Rival unit. The best upgrade from here is a set of
      power pedals — Favero's Assioma Duos use the same Look Keo cleats as the pedals listed.`,
    parts: [
      slot('frame', 'specialized-tarmac-sl7'),
      slot('fork', 'enve-ses-road-fork'),
      slot('headset', 'hope-integrated-is41-is52'),
      slot('wheels', 'zipp-303-firecrest'),
      slot('tires', 'pirelli-pzero-race'),
      slot('crankset', 'sram-force-axs-crankset'),
      slot('bottomBracket', 'sram-dub-bb'),
      slot('chain', 'sram-force-flattop-chain'),
      slot('cassette', 'sram-force-xg-1270'),
      slot('rearDerailleur', 'sram-force-axs-rd'),
      slot('frontDerailleur', 'sram-force-axs-fd'),
      slot('shifters', 'sram-force-axs-hrd-levers'),
      slot('brakes', 'sram-red-etap-hrd'),
      slot('rotors', 'shimano-rt-cl800-160'),
      slot('handlebars', 'zipp-sl-70-aero'),
      slot('stem', 'zipp-service-course-sl-stem'),
      slot('seatpost', 'zipp-sl-speed-carbon-seatpost'),
      slot('saddle', 'specialized-power-pro'),
      slot('pedals', 'look-keo-blade-carbon'),
    ],
  }),

  guide({
    id: 'entry-gravel',
    discipline: 'gravel',
    tier: 'entry',
    title: 'Entry-Level Gravel Build',
    summary: 'Steel Surly Straggler with SRAM Apex 1x12 mechanical and cable discs — cheap, tough and fixable anywhere.',
    body: `
      The Surly Straggler is a steel workhorse: mounts for racks and fenders, a threaded bottom bracket,
      12mm thru-axles and room for 42mm tires. It's heavy, but it'll outlive every other frame here, and
      it's the cheapest way into a modern disc gravel bike.

      SRAM Apex mechanical 1x12 keeps costs down: the 11-44 cassette fits a standard HG freehub (with the
      spacer that ships with it), and the mechanical levers pair with TRP Spyre dual-piston cable discs,
      which are easy to set up and service on the road. Going 1x also suits the Straggler: no front
      derailleur means no clamp adapter for its round seat tube, and less to clog with mud. Hunt's
      4 Season wheels are a durable, tubeless-ready alloy set.

      The heavy parts are the frame and the steel-railed saddle — accept them. Upgrade to hydraulic brakes
      first (SRAM Apex HRD levers + calipers), then to a lighter carbon fork if you're counting grams.`,
    parts: [
      slot('frame', 'surly-straggler'),
      slot('fork', 'whisky-no9-fork'),
      slot('headset', 'wolf-tooth-performance-zs44-ec44'),
      slot('wheels', 'hunt-4season-gravel'),
      slot('tires', 'teravail-rutland'),
      slot('crankset', 'sram-apex-1-crankset'),
      slot('bottomBracket', 'sram-dub-bb'),
      slot('chain', 'sram-apex-flattop-chain'),
      slot('cassette', 'sram-apex-xplr-pg-1231'),
      slot('rearDerailleur', 'sram-apex-xplr-rd'),
      slot('shifters', 'sram-apex-mechanical-levers'),
      slot('brakes', 'trp-spyre'),
      slot('rotors', 'shimano-sm-rt70-160'),
      slot('handlebars', 'salsa-cowbell-3'),
      slot('stem', 'salsa-guide-deluxe-stem'),
      slot('seatpost', 'ritchey-comp-2-bolt'),
      slot('saddle', 'wtb-volt-chromoly'),
      slot('pedals', 'shimano-pd-m520'),
    ],
  }),

  guide({
    id: 'dream-gravel',
    discipline: 'gravel',
    tier: 'dream',
    title: 'Dream Gravel Build',
    summary: 'Santa Cruz Stigmata CC, full ENVE wheels and cockpit, GRX 2x12 and Garmin power pedals.',
    body: `
      Our dream gravel bike prioritises speed you can keep all day. The Stigmata CC is a race-proven
      carbon frame with 45mm clearance and a threaded BSA bottom bracket — no creaks after a season of mud.
      ENVE supplies the G-Series fork, G23 wheels, gravel bar and stem, so the front end is light and
      consistent.

      We've chosen Shimano GRX RX820 2x12 over an electronic group on purpose: a 48/31 crank and 11-36
      cassette give road-bike gaps with a sub-1:1 bail-out gear, and a mechanical drivetrain never runs out
      of battery 200km from home. Schwalbe G-One R Pros at 40mm are fast and tough; Garmin Rally XC200
      dual-sided power pedals take SPD cleats so you can still walk.

      Want more? Drop to 38mm slicks for racing, or swap the post for a Redshift ShockStop for comfort on
      long washboard days. There isn't much left to upgrade here — ride it.`,
    parts: [
      slot('frame', 'santa-cruz-stigmata-cc'),
      slot('fork', 'enve-g-series-gravel-fork'),
      slot('headset', 'chris-king-dropset-2'),
      slot('wheels', 'enve-g23'),
      slot('tires', 'schwalbe-g-one-r-pro'),
      slot('crankset', 'shimano-grx-rx820-2-crankset'),
      slot('bottomBracket', 'shimano-bb-r9100'),
      slot('chain', 'shimano-cn-m8100'),
      slot('cassette', 'shimano-cs-hg710-12'),
      slot('rearDerailleur', 'shimano-grx-rd-rx820'),
      slot('frontDerailleur', 'shimano-grx-fd-rx820'),
      slot('shifters', 'shimano-grx-st-rx820'),
      slot('brakes', 'shimano-ultegra-r8170'),
      slot('rotors', 'shimano-rt-cl900-160'),
      slot('handlebars', 'enve-g-series-gravel-bar'),
      slot('stem', 'enve-stem'),
      slot('seatpost', 'enve-carbon-seatpost'),
      slot('saddle', 'specialized-s-works-power'),
      slot('pedals', 'garmin-rally-xc200'),
    ],
  }),

  guide({
    id: 'entry-xc',
    discipline: 'xc',
    tier: 'entry',
    title: 'Entry-Level XC Hardtail Build',
    summary: 'Santa Cruz Chameleon alloy hardtail, RockShox Judy and SRAM NX Eagle — real 12-speed for under $3k.',
    body: `
      The Santa Cruz Chameleon is an aluminium hardtail with a lifetime warranty, a threaded BSA bottom
      bracket and a UDH derailleur hanger, so it can grow with you all the way to SRAM Transmission. We've
      set it up as a 29er cross-country bike with a 100mm RockShox Judy Silver.

      SRAM NX Eagle gives you a full 11-50 12-speed range on a standard HG freehub, which means a cheap,
      tough DT Swiss M 1900 wheelset. Shimano Deore four-piston brakes are a step above most entry bikes,
      and fast-rolling Maxxis Rekon Race tires suit the XC brief. A PNW Rainier dropper is included because
      it's the best $200 you can spend on a mountain bike.

      Upgrade path: the fork is the weak link — a RockShox SID or Fox 34 transforms the bike. After that,
      lighter wheels with an XD driver unlock SRAM's 10-52 cassettes.`,
    parts: [
      slot('frame', 'santa-cruz-chameleon'),
      slot('fork', 'rockshox-judy-silver-tk'),
      slot('headset', 'cane-creek-40-zs44-zs56'),
      slot('wheels', 'dt-swiss-m-1900-spline-30'),
      slot('tires', 'maxxis-rekon-race'),
      slot('crankset', 'sram-nx-eagle-gxp-crankset'),
      slot('bottomBracket', 'sram-gxp-team-bsa-bb'),
      slot('chain', 'sram-nx-eagle-chain'),
      slot('cassette', 'sram-nx-eagle-pg-1230'),
      slot('rearDerailleur', 'sram-nx-eagle-rd'),
      slot('shifters', 'sram-nx-eagle-trigger'),
      slot('brakes', 'shimano-deore-m6120'),
      slot('rotors', 'galfer-wave-180-6b'),
      slot('handlebars', 'race-face-chester-31-8-bar'),
      slot('stem', 'race-face-aeffect-r-stem'),
      slot('seatpost', 'pnw-rainier-gen-4'),
      slot('saddle', 'wtb-volt-chromoly'),
      slot('pedals', 'shimano-pd-m520'),
    ],
  }),

  guide({
    id: 'dream-xc',
    discipline: 'xc',
    tier: 'dream',
    title: 'Dream XC Race Build',
    summary: 'Pivot Mach 4 SL with SRAM XX SL Transmission, RockShox SID SL and Roval Control SL carbon wheels.',
    body: `
      The Pivot Mach 4 SL is a World Cup-winning 100mm full-suspension race frame that weighs under 2kg
      with its shock. Crucially it has a UDH hanger, so it takes SRAM's XX SL Eagle Transmission — the
      lightest, most robust electronic MTB drivetrain made — which bolts straight through the frame.

      Up front is a RockShox SID SL Ultimate; the frame ships with a Fox Float DPS in its 165x45 trunnion
      size, which is all an XC racer needs. Roval Control SL wheels are featherweight carbon on XD drivers, Schwalbe Racing Ralph
      60s are fast without being fragile, and SRAM Level brakes with 180mm Galfer rotors (the frame and
      fork maximum) give more than enough control for XC.

      There's a deliberate choice here: a rigid ENVE seatpost instead of a dropper. Most racers now run a
      dropper, and a 31.6mm Fox Transfer or RockShox Reverb AXS is the first thing we'd add for technical
      courses.`,
    parts: [
      slot('frame', 'pivot-mach-4-sl'),
      slot('fork', 'rockshox-sid-sl-ultimate'),
      slot('headset', 'chris-king-inset-i2'),
      slot('wheels', 'roval-control-sl'),
      slot('tires', 'schwalbe-racing-ralph'),
      slot('crankset', 'sram-xx-sl-t-type-crankset'),
      slot('bottomBracket', 'sram-dub-pressfit-bb'),
      slot('chain', 'sram-xx-t-type-chain'),
      slot('cassette', 'sram-xx-t-type-xs-1297'),
      slot('rearDerailleur', 'sram-xx-sl-t-type-rd'),
      slot('shifters', 'sram-axs-pod-ultimate'),
      slot('brakes', 'sram-level-tlm'),
      slot('rotors', 'galfer-wave-180-6b'),
      slot('handlebars', 'oneup-carbon-bar'),
      slot('stem', 'race-face-turbine-r-35-stem'),
      slot('seatpost', 'enve-carbon-seatpost-31-6'),
      slot('saddle', 'ergon-smr3'),
      slot('pedals', 'shimano-xtr-pd-m9100'),
    ],
  }),

  guide({
    id: 'entry-enduro',
    discipline: 'trail',
    tier: 'entry',
    title: 'Entry-Level Enduro Build',
    summary: 'Commencal Meta AM 29 alloy, Marzocchi Z1 Coil and Shimano SLX — big travel without the big bill.',
    body: `
      Commencal's Meta AM 29 is one of the best-value enduro frames available: 160mm of rear travel, a
      threaded BB, ZS headset, and geometry that's ready for race tracks. It ships with a Fox Float X2, so
      there's no need to buy a shock. Up front, the Marzocchi Bomber Z1 Coil is a 170mm fork that's simple,
      supple and cheap to service.

      Shimano SLX 12-speed is nearly as good as XT for less. Its 10-51 cassette needs a Microspline driver,
      which the Shimano XT wheelset has; Center Lock 203mm rotors and four-piston SLX brakes give
      enduro-grade stopping. Maxxis Minion DHR IIs front and rear are a safe, predictable tire choice.

      Where we saved: an alloy 31.8mm cockpit and composite flat pedals. Upgrade tires first (an Assegai
      up front), then wheels; the frame and suspension are already good enough to race.`,
    parts: [
      slot('frame', 'commencal-meta-am-29'),
      slot('fork', 'marzocchi-bomber-z1-coil'),
      slot('headset', 'cane-creek-40-zs44-zs56'),
      slot('wheels', 'shimano-xt-wh-m8120'),
      slot('tires', 'maxxis-minion-dhr-ii'),
      slot('crankset', 'shimano-slx-m7100-crankset'),
      slot('bottomBracket', 'shimano-bb-mt800'),
      slot('chain', 'shimano-cn-m7100'),
      slot('cassette', 'shimano-slx-m7100-cassette'),
      slot('rearDerailleur', 'shimano-slx-rd-m7100'),
      slot('shifters', 'shimano-slx-sl-m7100'),
      slot('brakes', 'shimano-slx-m7120'),
      slot('rotors', 'shimano-rt-mt800-203'),
      slot('handlebars', 'race-face-chester-31-8-bar'),
      slot('stem', 'race-face-aeffect-r-stem'),
      slot('seatpost', 'pnw-rainier-gen-4'),
      slot('saddle', 'sdg-bel-air-3'),
      slot('pedals', 'oneup-composite-pedal'),
    ],
  }),

  guide({
    id: 'dream-enduro',
    discipline: 'trail',
    tier: 'dream',
    title: 'Dream Enduro Build',
    summary: 'Transition Sentinel Carbon, Fox 38 + Öhlins coil, SRAM X0 Transmission and Mavens on Reserve carbon.',
    body: `
      The Transition Sentinel is a 160mm 29er that climbs better than it has any right to and descends
      like a downhill bike. It has a UDH hanger, so SRAM X0 Eagle Transmission bolts straight on — no
      hanger to bend, and wireless AXS shifting that keeps working after you've smashed it into a rock.

      Suspension is a 170mm Fox 38 Factory and — replacing the stock Super Deluxe — an Öhlins TTX22M.2
      coil in the Sentinel's 205x65 trunnion size. SRAM Maven brakes are the most powerful we list; with 220mm HS2 rotors (the frame's maximum)
      they stop like a motorcycle. Reserve 30 HD carbon wheels come with a lifetime warranty, and Maxxis
      Assegais are the benchmark enduro tire.

      This is a no-compromise race build, but not the lightest. The stock air shock is genuinely good, so
      skip the Öhlins if you're not racing; likewise a cable dropper saves $600 over the Reverb AXS, and a
      35mm aluminium bar is often more comfortable than carbon.`,
    parts: [
      slot('frame', 'transition-sentinel-carbon'),
      slot('fork', 'fox-38-factory'),
      slot('rearShock', 'ohlins-ttx22m2-205x65'),
      slot('headset', 'chris-king-inset-i2'),
      slot('wheels', 'reserve-30-hd'),
      slot('tires', 'maxxis-assegai'),
      slot('crankset', 'sram-x0-t-type-crankset'),
      slot('bottomBracket', 'sram-dub-bb'),
      slot('chain', 'sram-xx-t-type-chain'),
      slot('cassette', 'sram-x0-t-type-xs-1295'),
      slot('rearDerailleur', 'sram-x0-t-type-rd'),
      slot('shifters', 'sram-axs-pod-ultimate'),
      slot('brakes', 'sram-maven-silver'),
      slot('rotors', 'sram-hs2-220-6b'),
      slot('handlebars', 'enve-m7-mountain-bar'),
      slot('stem', 'enve-mountain-stem'),
      slot('seatpost', 'rockshox-reverb-axs'),
      slot('saddle', 'ergon-smr3'),
      slot('pedals', 'chromag-dagga'),
    ],
  }),

  guide({
    id: 'track-racer',
    discipline: 'track',
    tier: 'enthusiast',
    title: 'Track Racing Build',
    summary: 'Cinelli Tipo Pista, Sugino 75 crank and Mavic Ellipse wheels — a proper velodrome fixed gear.',
    body: `
      A track bike is about as simple as a bicycle gets, which means every part counts. The Cinelli Tipo
      Pista is a stiff aluminium frame with 120mm rear track ends, a threaded BB and a 1-1/8" headset;
      the Soma track fork matches its straight steerer and nutted 100mm front axle.

      Mavic Ellipse wheels are the classic velodrome choice, with a fixed-gear track hub. The Sugino 75
      crank on a square-taper bottom bracket is a keirin-approved standard, with a 48T ring and a Phil Wood
      18T cog for a ~70 gear-inch starting ratio. 23mm Continental GP5000s are fast on boards and fit the
      15mm rims well.

      There are no brakes — on a velodrome you don't use them. If you're riding on the road, choose a frame
      and fork with brake holes (the Surly Steamroller, for example) and fit at least a front caliper.
      Bring a spare cog or two for gearing changes.`,
    parts: [
      slot('frame', 'cinelli-tipo-pista'),
      slot('fork', 'soma-track-fork'),
      slot('headset', 'chris-king-nothreadset'),
      slot('wheels', 'mavic-ellipse'),
      slot('tires', 'continental-gp5000-23'),
      slot('crankset', 'sugino-75-crankset'),
      slot('bottomBracket', 'shimano-bb-un300'),
      slot('chain', 'izumi-super-toughness-kai-chain'),
      slot('sprocket', 'phil-wood-track-cog-18t'),
      slot('handlebars', 'zipp-service-course-80'),
      slot('stem', 'ritchey-comp-4-axis-17'),
      slot('seatpost', 'zipp-sl-speed-carbon-seatpost'),
      slot('saddle', 'fizik-vento-antares-r1'),
      slot('pedals', 'wahoo-speedplay-zero'),
    ],
  }),

  guide({
    id: 'bmx-street',
    discipline: 'bmx',
    tier: 'mid',
    title: 'Street BMX Build',
    summary: 'S&M ATF frame, Odyssey Thunderbolt cranks and Hazard Lite wheels — a brakeless street build that lasts.',
    body: `
      The S&M ATF is a legendary street frame: heat-treated chromoly, a Mid bottom bracket, integrated
      headset and 20" wheels with 110mm rear spacing. The Odyssey R32 fork matches its 1-1/8" steerer and
      3/8" axle; Hazard Lite wheels with a cassette driver hub take a 10T Profile driver.

      Odyssey's Thunderbolt cranks use a 22mm spindle, so we've paired them with Odyssey's Mid BB. Broc
      bars on a Boss stem, a pivotal seat and post, and Twisted PC pedals round it out. Maxxis Grifters at
      2.3" are grippy and long-lasting on concrete.

      This is a brakeless build — common for street, and the R32 fork has no brake mounts anyway. If you
      want a rear brake, the ATF has U-brake mounts; add an Odyssey Springfield and a lever. First upgrade:
      pegs and a lighter set of tires.`,
    parts: [
      slot('frame', 's-and-m-atf'),
      slot('fork', 'odyssey-r32-fork'),
      slot('headset', 'fsa-orbit-mx'),
      slot('wheels', 'odyssey-hazard-lite-wheelset'),
      slot('tires', 'maxxis-grifter'),
      slot('crankset', 'odyssey-thunderbolt-crankset'),
      slot('bottomBracket', 'odyssey-mid-bb-22'),
      slot('chain', 'kmc-z510hx-chain'),
      slot('sprocket', 'profile-racing-elite-driver-10t'),
      slot('handlebars', 'odyssey-broc-bar'),
      slot('stem', 'odyssey-boss-v2-stem'),
      slot('seatpost', 'odyssey-pivotal-seatpost'),
      slot('saddle', 'odyssey-mid-pivotal-seat'),
      slot('pedals', 'odyssey-twisted-pc'),
    ],
    extras: [{ name: 'Odyssey Graduate pegs (pair)', price: 40 }],
  }),

  guide({
    id: 'urban-commuter',
    discipline: 'urban',
    tier: 'entry',
    title: 'Entry-Level Commuter Build',
    summary: 'Surly Cross-Check, Shimano CUES 1x11, V-brakes and puncture-proof tires — a commuter you can leave outside.',
    body: `
      The Surly Cross-Check is the definitive do-anything steel bike: rack and fender mounts, room for 45mm
      tires, and cantilever/V-brake bosses that make it cheap to run. It uses quick-release axles and a
      1-1/8" threadless headset, so parts are inexpensive and everywhere.

      Shimano's CUES U6000 1x11 is built for commuters: Linkglide shifting that's tough and long-lasting,
      an 11-50 cassette for loaded hills, and a simple flat-bar trigger. Shimano's RS100 rim-brake wheels
      are basic but true; Schwalbe Marathon Plus tires make punctures nearly a thing of the past. Deore
      T610 V-brakes come as a set with their matching levers and stop well in the wet.

      It's heavy — that's the point. Spend the money you saved on fenders, a rack and good lights (we've
      listed some as extras). If you ever want drop bars, the Cross-Check takes them; you'd swap the
      shifter and brake levers for road levers.`,
    parts: [
      slot('frame', 'surly-cross-check'),
      slot('fork', 'surly-cross-check-fork'),
      slot('headset', 'fsa-orbit-mx'),
      slot('wheels', 'shimano-wh-rs100'),
      slot('tires', 'schwalbe-marathon-plus'),
      slot('crankset', 'shimano-cues-u6000-crankset'),
      slot('bottomBracket', 'shimano-bb-mt800'),
      slot('chain', 'shimano-cn-lg500'),
      slot('cassette', 'shimano-cues-lg600-11-cassette'),
      slot('rearDerailleur', 'shimano-cues-rd-u6000-11'),
      slot('shifters', 'shimano-cues-sl-u6000-11r'),
      slot('brakes', 'shimano-deore-t610-v-brake'),
      slot('handlebars', 'surly-moloko'),
      slot('stem', 'thomson-x4'),
      slot('seatpost', 'ritchey-comp-2-bolt'),
      slot('saddle', 'brooks-b17'),
      slot('pedals', 'race-face-chester-pedal'),
    ],
    extras: [
      { name: 'SKS Longboard fenders', price: 60 },
      { name: 'Tubus Cargo rear rack', price: 120 },
      { name: 'Lezyne light set', price: 90, notes: 'Front + rear, USB-C' },
    ],
  }),
  guide({
    id: 'alt-crust-bombora',
    discipline: 'touring',
    tier: 'enthusiast',
    title: 'Crust Bombora 650B Swept-Bar Adventure Build',
    summary: 'Crust Bombora on 650Bx48 Rene Herse tires, Deore 1x11 with an 11-51 cassette, Paul Klampers and a Sunrise bar.',
    body: `
      The Crust Bombora is a lugged-look steel all-roader with flat-mount disc brakes and 12mm thru-axles,
      which matters here: it's one of the few alt-bike frames that takes a modern flat-mount caliper with
      no adapter. It clears 58mm in 650B, so we run Rene Herse Switchback Hill 48s on Velo Orange's Voyager
      thru-axle wheels — supple, tubeless and fast on washboard.

      This is a flat-bar build in the xBiking style: Surly's steel Sunrise bar (wide, swept back) on a Paul
      Boxcar stem, with Paul Canti Levers pulling Paul Klampers. The Klampers are expensive, but they're
      the best-feeling cable disc brake made and you can rebuild them forever. Deore M5100 1x11 does the
      shifting; the 11-51 cassette and a 32T ring give you a gear for walking-pace climbs with a load.
      The Voyager hub has a road freehub, so the MTB cassette goes on with a 1.85mm spacer.

      Compromises: Crust doesn't make a 25.4mm-clamp 1-1/8" threadless stem, and neither does anyone else
      at the moment, so their own Towel Rack bar is out unless you find a used Thomson. The Sunrise is a
      good stand-in. MKS Lambda pedals and a Brooks Cambium keep it comfortable in normal shoes.`,
    parts: [
      slot('frame', 'crust-bombora-frame'),
      slot('fork', 'crust-bombora-fork'),
      slot('headset', 'velo-orange-grand-cru-threadless-1-1-8'),
      slot('wheels', 'velo-orange-voyager-disc-650b-ta-wheels'),
      slot('tires', 'rene-herse-switchback-hill-650x48'),
      slot('crankset', 'shimano-deore-fc-m5100-1-crankset'),
      slot('bottomBracket', 'shimano-sm-bb52'),
      slot('chain', 'kmc-x11-chain'),
      slot('cassette', 'shimano-deore-cs-m5100-11-cassette'),
      slot('rearDerailleur', 'shimano-deore-rd-m5100-sgs'),
      slot('shifters', 'shimano-deore-sl-m5100-r'),
      slot('brakes', 'paul-klampers-flat'),
      slot('brakeLevers', 'paul-canti-lever'),
      slot('rotors', 'sram-centerline-160-6b'),
      slot('handlebars', 'surly-sunrise-bar'),
      slot('stem', 'paul-boxcar-stem'),
      slot('seatpost', 'ritchey-classic-2-bolt-seatpost-27-2'),
      slot('saddle', 'brooks-cambium-c17'),
      slot('pedals', 'mks-lambda'),
    ],
    extras: [
      { name: 'Crust Bikes Towel Rack bar (if you find a 25.4 stem)', price: 85 },
      { name: 'Ortlieb handlebar roll', price: 110 },
      { name: 'Frame bag (custom fit)', price: 150 },
    ],
  }),
  guide({
    id: 'alt-rivendell-appaloosa',
    discipline: 'touring',
    tier: 'enthusiast',
    title: 'Rivendell Appaloosa Upright Tourer Build',
    summary: 'Rivendell Appaloosa with Nitto Albatross bars, Silver2 friction thumbies, a 9-speed triple, Paul cantis, a Brooks and MKS pedals.',
    body: `
      The Appaloosa is Rivendell doing what Rivendell does: lugged steel, long chainstays, a threaded 1"
      steerer, cantilever bosses and room for 56mm tires. Build it the Riv way and it becomes an all-day,
      any-surface bike you ride in normal clothes. We run 650Bx48 Rene Herse Switchback Hills on Velo
      Orange's Chronos/Voyager rim-brake wheels.

      Shifting is Rivendell's Silver2 friction thumb shifters on a Nitto Albatross swept bar and Technomic
      quill stem. Friction doesn't care about speeds, so a cheap and durable 9-speed drivetrain does the job:
      a Sugino XD600 46/36/24 triple, an 11-36 HG400 cassette and a Deore Shadow derailleur. That gives you
      a sub-1:1 granny gear for loaded climbs. Paul Neo-Retro cantis with Paul Canti Levers stop well and
      look right. The road freehub on the wheels takes the 9-speed cassette with a spacer.

      Finish with a Nitto Jaguar seatpost, a Brooks B17 and MKS Sylvan Touring pedals. It isn't light and it
      isn't fast, and that's the point. The money goes into things that last 30 years.`,
    parts: [
      slot('frame', 'rivendell-appaloosa-frame'),
      slot('fork', 'rivendell-appaloosa-fork'),
      slot('headset', 'tange-levin-cds-1in-threaded'),
      slot('wheels', 'velo-orange-chronos-voyager-650b-wheels'),
      slot('tires', 'rene-herse-switchback-hill-650x48'),
      slot('crankset', 'sugino-xd600-triple-crankset'),
      slot('bottomBracket', 'tange-ln-7922-68x122'),
      slot('chain', 'kmc-x9-chain'),
      slot('cassette', 'shimano-cs-hg400-9-cassette'),
      slot('frontDerailleur', 'shimano-deore-xt-fd-t8000'),
      slot('rearDerailleur', 'shimano-deore-rd-m592-sgs'),
      slot('shifters', 'rivendell-silver2-thumb-shifters'),
      slot('brakes', 'paul-neo-retro-cantilever'),
      slot('brakeLevers', 'paul-canti-lever'),
      slot('handlebars', 'nitto-albatross-bar'),
      slot('stem', 'nitto-technomic-stem'),
      slot('seatpost', 'nitto-jaguar-seatpost-26-8'),
      slot('saddle', 'brooks-b17'),
      slot('pedals', 'mks-sylvan-touring'),
    ],
    extras: [
      { name: 'Cork grips + shellac', price: 30 },
      { name: 'Nitto Big Back Rack', price: 230 },
      { name: 'Wald 137 basket', price: 35, notes: 'Optional, but very Rivendell' },
    ],
  }),
  guide({
    id: 'alt-sklar-supersomething',
    discipline: 'touring',
    tier: 'dream',
    title: 'Sklar SuperSomething All-Road Build',
    summary: 'Handbuilt Sklar SuperSomething with bar-end shifters, GRX 1x11, White Industries cranks and Paul Klampers.',
    body: `
      Adam Sklar's SuperSomething is a handbuilt steel all-road bike from Bozeman: flat-mount discs, 12mm
      thru-axles, room for 52mm 700c tires and a straight 1-1/8" steerer in an EC34/EC44 head tube. We
      gave it the parts it deserves. A Cane Creek 40 headset, Hunt 4Season gravel wheels, and Rene Herse
      Snoqualmie Pass 44s.

      The drivetrain is a mix you'll only find on alt bikes. Microshift BS-M11 bar-end shifters run a
      Shimano GRX RX812 derailleur. Shimano road 11-speed and GRX share the same cable pull, so it indexes
      properly. The derailleur clears an XT 11-42 cassette. Up front is a White Industries M30 crank with
      a 32T ring. It's lovely to look at and spins on a WI BSA30 bottom bracket. The MTB cassette needs a
      spacer on the road freehub.

      Paul Klampers with Cane Creek SCR-5 levers is the classic cable-disc setup. It's mechanical and simple
      to fix anywhere. A Salsa Cowchipper flared bar on a Paul Boxcar stem rounds it out. The Hunt hubs are
      Center Lock, so the rotors are Shimano RT-MT800.`,
    parts: [
      slot('frame', 'sklar-supersomething-frame'),
      slot('fork', 'sklar-supersomething-fork'),
      slot('headset', 'cane-creek-40-ec34-ec44-straight'),
      slot('wheels', 'hunt-4season-gravel'),
      slot('tires', 'rene-herse-snoqualmie-pass-700x44'),
      slot('crankset', 'white-industries-m30-crankset'),
      slot('bottomBracket', 'white-industries-bsa30-bb'),
      slot('chain', 'kmc-x11-chain'),
      slot('cassette', 'shimano-xt-m8000-11-cassette'),
      slot('rearDerailleur', 'shimano-grx-rd-rx812'),
      slot('shifters', 'microshift-bs-m11-bar-end-shifters'),
      slot('brakes', 'paul-klampers-flat'),
      slot('brakeLevers', 'cane-creek-scr-5'),
      slot('rotors', 'shimano-rt-mt800-160'),
      slot('handlebars', 'salsa-cowchipper'),
      slot('stem', 'paul-boxcar-stem'),
      slot('seatpost', 'ritchey-classic-2-bolt-seatpost-27-2'),
      slot('saddle', 'brooks-cambium-c17'),
      slot('pedals', 'shimano-pd-m520'),
    ],
    extras: [
      { name: 'Sklar custom paint', notes: 'Every SuperSomething gets one-off paint; budget accordingly' },
      { name: 'Bar tape (cotton, shellacked)', price: 25 },
    ],
  }),
  guide({
    id: 'alt-budget-disc-trucker',
    discipline: 'touring',
    tier: 'entry',
    title: 'Budget Alt-Tourer Build',
    summary: 'Surly Disc Trucker with a swept steel bar, friction thumbies, a 9-speed triple and cheap, reliable flat-mount mechanical discs.',
    body: `
      If you want an alt-touring bike without boutique prices, start with a Surly Disc Trucker. It's steel and
      takes racks anywhere. It has 12mm thru-axles, flat-mount disc brakes and room for 47mm tires. We'd have
      used an Ogre or Bridge Club, but those frames are IS-mount, and you can't currently buy an IS caliper
      new. The Disc Trucker takes inexpensive flat-mount calipers with no adapter.

      The cockpit is the alt-bike formula: a Surly Sunrise swept bar and Rivendell Silver2 friction thumb
      shifters. Friction works with any speed, so we use the cheapest dependable 9-speed parts: a Sugino
      XD600 triple, an HG400 11-36 cassette and an Alivio Shadow derailleur. Shimano RS305 cable discs
      with Tektro FL750 flat-bar levers cost less than one Paul Klamper and stop fine with a load.

      Velo Orange's Voyager thru-axle wheels are the big spend, and they'll survive a loaded tour. Surly
      ExtraTerrestrial 41s are tough and roll well. The cassette needs a spacer on the road freehub. Save on
      the saddle and pedals now and upgrade them as you ride.`,
    parts: [
      slot('frame', 'surly-disc-trucker-frame'),
      slot('fork', 'surly-disc-trucker-fork'),
      slot('headset', 'fsa-orbit-mx'),
      slot('wheels', 'velo-orange-voyager-disc-700c-ta-wheels'),
      slot('tires', 'surly-extraterrestrial-700x41'),
      slot('crankset', 'sugino-xd600-triple-crankset'),
      slot('bottomBracket', 'shimano-bb-un300'),
      slot('chain', 'kmc-x9-chain'),
      slot('cassette', 'shimano-cs-hg400-9-cassette'),
      slot('frontDerailleur', 'shimano-deore-xt-fd-t8000'),
      slot('rearDerailleur', 'shimano-alivio-rd-m3100-sgs'),
      slot('shifters', 'rivendell-silver2-thumb-shifters'),
      slot('brakes', 'shimano-br-rs305'),
      slot('brakeLevers', 'tektro-fl750'),
      slot('rotors', 'sram-centerline-160-6b'),
      slot('handlebars', 'surly-sunrise-bar'),
      slot('stem', 'salsa-guide-deluxe-stem'),
      slot('seatpost', 'ritchey-comp-2-bolt'),
      slot('saddle', 'wtb-volt-chromoly'),
      slot('pedals', 'mks-gr-9'),
    ],
    extras: [
      { name: 'Surly 8-Pack front rack', price: 160 },
      { name: 'Planet Bike fenders', price: 45 },
    ],
  }),
  guide({
    id: 'alt-crust-romanceur-rando',
    discipline: 'touring',
    tier: 'dream',
    title: 'Crust Romanceur 650B Randonneur Build',
    summary: 'Crust Romanceur canti on 650Bx48 tires, a Rene Herse double, bar-end shifters, Nitto Noodle bars and Paul cantis.',
    body: `
      The Romanceur is Crust's take on the French randonneuse. It's 650B only, with low trail for a
      handlebar bag, a threaded 1" steerer, cantilever bosses and room for 56mm tires. Build it as a classic
      rando: Rene Herse 48mm tires on Velo Orange Chronos/Voyager wheels (130mm, to match the frame), a Nitto
      Noodle bar on a Technomic Deluxe quill and a Gilles Berthoud saddle.

      The Rene Herse 48/32 double is light and the rings are replaceable. With Shimano 105 11-32 in back and
      SL-BSR1 bar-end shifters it indexes properly. The rando-style front shifter is friction, so trimming is
      easy. The Romanceur uses a clamp-on front derailleur, so the braze-on 105 FD needs a clamp adapter.
      Paul Neo-Retros with Velo Orange's non-aero levers keep the cables out front where a rando bag wants
      them.

      Rando-style means fenders, a front rack and a dynamo light. Those are listed as extras because they're
      fitted to the frame. This is a bike for 300km brevets that you'd also happily ride to the bakery.`,
    parts: [
      slot('frame', 'crust-romanceur-canti-frame'),
      slot('fork', 'crust-romanceur-canti-fork'),
      slot('headset', 'velo-orange-grand-cru-threaded-1in'),
      slot('wheels', 'velo-orange-chronos-voyager-650b-wheels-130'),
      slot('tires', 'rene-herse-switchback-hill-650x48'),
      slot('crankset', 'rene-herse-double-crankset'),
      slot('bottomBracket', 'velo-orange-grand-cru-sealed-bb-68x110'),
      slot('chain', 'kmc-x11-chain'),
      slot('cassette', 'shimano-105-r7000-cassette'),
      slot('frontDerailleur', 'shimano-105-fd-r7000'),
      slot('rearDerailleur', 'shimano-105-rd-r7000-gs'),
      slot('shifters', 'shimano-sl-bsr1-bar-end-shifters'),
      slot('brakes', 'paul-neo-retro-cantilever'),
      slot('brakeLevers', 'velo-orange-grand-cru-non-aero-levers'),
      slot('handlebars', 'nitto-noodle-bar'),
      slot('stem', 'nitto-technomic-deluxe-stem'),
      slot('seatpost', 'nitto-s83-crystal-fellow-27-2'),
      slot('saddle', 'gilles-berthoud-aspin'),
      slot('pedals', 'mks-sylvan-touring'),
    ],
    extras: [
      { name: 'Honjo hammered fenders (650B x 58)', price: 140 },
      { name: 'Velo Orange Constructeur front rack', price: 120 },
      { name: 'Edelux II dynamo headlight', price: 220, notes: 'Pair with a dynamo front wheel' },
      { name: 'Clamp-on FD adapter (28.6mm)', price: 15 },
    ],
  }),
  guide({
    id: 'vintage-bridgestone-mb1-restomod',
    discipline: 'vintage',
    tier: 'mid',
    title: 'Bridgestone MB-1 Resto-Mod Build',
    summary: "A '93 Bridgestone MB-1 rebuilt as a modern do-anything bike: Phil Wood wheels, friction thumbies, Paul cantis, a Nitto Bosco bar and supple Rene Herse 26\" tires.",
    body: `
      Grant Petersen's Bridgestone MB-1 is the classic resto-mod frame. It has lively Tange cro-mo
      tubing, room for 60mm tires and a threaded 1" steerer, and nobody minds if you don't keep it stock.
      This one keeps the bike's spirit but swaps in parts you can actually buy and service. That starts with
      a Chris King GripNut headset and a Ritchey Logic rigid fork.

      The MB-1 is spaced 130mm, so we match it with Phil Wood freewheel hubs laced to Araya RM-20 rims. That
      avoids cold-setting the rear triangle, and Phil hubs last forever. A DNP Epoch 11-32 8-speed freewheel,
      KMC X8 chain and a Deore Shadow derailleur run from Rivendell Silver2 friction thumbies. Up front, an
      XT M737 Compact Drive triple (42/32/22) and an M737 front derailleur are period-correct for '93 and
      still easy to find.

      The cockpit is upright: a Nitto Bosco swept bar on a Technomic quill. Paul Neo-Retro cantis and Paul
      Canti Levers do the braking. Rene Herse Naches Pass 26x1.8 tires roll like road tires and suit the
      narrow vintage rims (wider tires would balloon on a 16mm rim). Add a Brooks B17 and MKS Lambdas and
      you've got the bike Bridgestone's catalog always promised.`,
    parts: [
      slot('frame', 'bridgestone-mb-1-1993'),
      slot('fork', 'ritchey-logic-rigid-mtb-fork-1in-threaded'),
      slot('headset', 'chris-king-gripnut-1in'),
      slot('wheels', 'phil-wood-araya-rm20-freewheel-wheels-26'),
      slot('tires', 'rene-herse-naches-pass-26x1-8'),
      slot('crankset', 'shimano-deore-xt-fc-m737-crankset'),
      slot('bottomBracket', 'shimano-deore-xt-bb-un72-73x113'),
      slot('chain', 'kmc-x8-chain'),
      slot('cassette', 'dnp-epoch-8-freewheel'),
      slot('frontDerailleur', 'shimano-deore-xt-fd-m737'),
      slot('rearDerailleur', 'shimano-deore-rd-m592-sgs'),
      slot('shifters', 'rivendell-silver2-thumb-shifters'),
      slot('brakes', 'paul-neo-retro-cantilever'),
      slot('brakeLevers', 'paul-canti-lever'),
      slot('handlebars', 'nitto-bosco-bar'),
      slot('stem', 'nitto-technomic-stem'),
      slot('seatpost', 'nitto-s83-crystal-fellow-27-2'),
      slot('saddle', 'brooks-b17'),
      slot('pedals', 'mks-lambda'),
    ],
    extras: [
      { name: 'Frame + fork media blast and powder coat', price: 350, notes: 'Optional. Many MB-1 owners keep the original paint' },
      { name: 'Cork grips', price: 25 },
    ],
  }),
  guide({
    id: 'vintage-stumpjumper-xt-m730',
    discipline: 'vintage',
    tier: 'enthusiast',
    title: 'Early Stumpjumper Deore XT Period Build',
    summary: "An early Specialized Stumpjumper rebuilt with the Deore XT M730 group: cantis, a triple, a 22.2mm Cr-Mo cockpit and 2.1\" knobbies.",
    body: `
      The Stumpjumper was the first mass-produced mountain bike, and the early frames are now collector
      pieces. They're built around 126mm rear spacing, a 1" threaded steerer, cantilever bosses and a small
      25.4mm seatpost. This period build uses the Deore XT M730 group, the parts most
      donor bikes from the era carry, and makes no modern substitutions where an original part still works.

      The drivetrain is XT M730: a 46/36/26 triple, a clamp-on front derailleur and the M730 rear mech
      shifting a Suntour New Winner Pro 13-28 freewheel. The wheels are freewheel hubs on Araya 7X rims at
      the original 126mm spacing, so the frame needs no spreading. The shifters are XT SL-M700 friction
      thumbies. That's period-correct for the first XT bikes, and they'll shift any 7-speed freewheel with
      no fuss. Brakes are BR-M730 cantilevers with BL-M730 levers.

      Specialized's own Cr-Mo flat bar and quill stem are 22.2mm, as they were in 1981–86, so swap them as a
      pair. The catalog doesn't list a 25.4mm seatpost, so it's an extra: look for an SR Laprade or the
      original Specialized post. Specialized Ground Control 2.1s finish the look. Expect to pay collector
      prices for the frame and to spend weekends hunting NOS parts.`,
    parts: [
      slot('frame', 'specialized-stumpjumper-1981'),
      slot('fork', 'tange-crmo-unicrown-mtb-fork-1in'),
      slot('headset', 'shimano-deore-xt-hp-m730-headset'),
      slot('wheels', 'bullseye-araya-7x-freewheel-wheels-26'),
      slot('tires', 'specialized-ground-control-26x2-1'),
      slot('crankset', 'shimano-deore-xt-fc-m730-crankset'),
      slot('bottomBracket', 'shimano-bb-un55-68x113'),
      slot('chain', 'sedis-sedisport-chain'),
      slot('cassette', 'suntour-new-winner-pro-7-freewheel'),
      slot('frontDerailleur', 'shimano-deore-xt-fd-m730'),
      slot('rearDerailleur', 'shimano-deore-xt-rd-m730'),
      slot('shifters', 'shimano-deore-xt-sl-m700-thumb-shifters'),
      slot('brakes', 'shimano-deore-xt-br-m730-cantilever'),
      slot('brakeLevers', 'shimano-deore-xt-bl-m730'),
      slot('handlebars', 'specialized-stumpjumper-cro-mo-flat-bar'),
      slot('stem', 'specialized-cro-mo-quill-mtb-stem'),
      slot('saddle', 'avocet-racing-ii'),
      slot('pedals', 'shimano-deore-xt-pd-m730'),
    ],
    extras: [
      { name: 'Seatpost, 25.4mm (SR Laprade or original Specialized)', price: 35, notes: 'Not in the catalog yet. Measure your seat tube; early frames vary' },
      { name: 'Oury grips', price: 15 },
      { name: 'Toe clips + straps (Christophe / MKS)', price: 40 },
    ],
  }),
]

export function getGuide(id: string): BuildGuide | undefined {
  return BUILD_GUIDES.find((g) => g.id === id)
}

/** Which /guides section a guide is filed under. */
export function guideDiscipline(g: BuildGuide): GuideDiscipline {
  return disciplineById.get(g.id) ?? 'urban'
}
