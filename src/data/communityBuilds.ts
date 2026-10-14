import type { Build, CommunityBuild, ComponentSlot } from '@/types/build'
import type { Part, PartCategory } from '@/types/parts'
import { ALL_CATEGORIES, defaultQuantity } from '@/data/categoryConfig'
import { getPartById } from '@/data/partsDatabase'

/**
 * Seeded "Completed Builds" (PCPartPicker's /builds/). Authors are fictional handles.
 * Catalog parts are referenced by id; a few builds include custom parts (isCustom)
 * and extras, the way real users fill in things the catalog doesn't list.
 * Builds may carry a deliberate compat warning, but never an error — see
 * `node .context/tools/run-ts.mjs .context/tools/check-guides.ts`.
 *
 * Array order matters: the home page features the first four.
 */

const DEV = import.meta.env?.DEV ?? true
const ORDER = new Map(ALL_CATEGORIES.map((c, i) => [c.id, i]))

function slot(category: PartCategory, id: string, quantity = defaultQuantity(category)): ComponentSlot | null {
  const part = getPartById(id)
  if (!part) {
    const msg = `[communityBuilds] unknown catalog part id "${id}" (${category})`
    if (DEV) throw new Error(msg)
    console.error(msg)
    return null
  }
  return quantity === 1 ? { category, part } : { category, part, quantity }
}

/** A user-entered part that isn't in the catalog. No attrs, so the engine doesn't check it. */
function custom(category: PartCategory, brand: string, name: string, price: number, weightG?: number, quantity = 1): ComponentSlot {
  const slug = `${brand}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const part: Part = { id: `custom-${slug}`, name, brand, category, price, weightG, specs: {}, tags: [], isCustom: true }
  return quantity === 1 ? { category, part } : { category, part, quantity }
}

interface EntryInput {
  id: string
  author: string
  publishedAt: string
  likes: number
  comments: number
  name: string
  description?: string
  story: string
  actualWeightG?: number
  parts: Array<ComponentSlot | null>
  extras?: Array<{ name: string; price?: number; notes?: string }>
}

function entry(e: EntryInput): CommunityBuild {
  const components = e.parts
    .filter((s): s is ComponentSlot => s !== null)
    .sort((a, b) => (ORDER.get(a.category) ?? 99) - (ORDER.get(b.category) ?? 99))
  const build: Build = {
    name: e.name,
    description: e.description,
    ownerName: e.author,
    createdAt: e.publishedAt,
    updatedAt: e.publishedAt,
    components,
  }
  if (e.extras?.length) build.additionalItems = e.extras.map((x, i) => ({ id: `${e.id}-extra-${i + 1}`, ...x }))
  const out: CommunityBuild = {
    id: e.id,
    author: e.author,
    publishedAt: e.publishedAt,
    likes: e.likes,
    comments: e.comments,
    story: e.story.trim().replace(/\n[ \t]+/g, '\n'),
    build,
  }
  if (e.actualWeightG) out.actualWeightG = e.actualWeightG
  return out
}

export const COMMUNITY_BUILDS: CommunityBuild[] = [
  entry({
    id: 'ti-all-road-commuter',
    author: 'kestrel_rides',
    publishedAt: '2026-09-14T08:30:00Z',
    likes: 412,
    comments: 58,
    name: 'Ti All-Road Commuter',
    description: 'Lynskey GR300 set up for a 30km mixed-surface commute, 12 months a year.',
    actualWeightG: 10320,
    story: `
      My commute is 15km each way: canal towpath, a gravel cut-through and some genuinely awful city
      tarmac. I wanted one bike that does all of it in the rain without me ever thinking about it, so
      titanium was the obvious frame material — no paint to chip, no rust, and the GR300 has every mount
      I could ask for.

      I ran a 2x setup on my old bike and never used the big ring, so this is GRX 1x with a 10-51 Deore
      Microspline cassette. The RX822 derailleur handles it fine and the 40T ring is plenty for 30km/h on
      the flat. The fork is a one-off Ti fork from a local builder to match the frame (listed as a custom
      part — it's 12mm thru-axle and flat mount like any carbon gravel fork).

      The Redshift stem and seatpost are the best comfort upgrade I've made: on cobbles the difference is
      night and day. Cinturato H 45s are the max the frame takes and roll better than they look. Without
      the rack and bags it weighs 10.3kg on my scale — sealant and bar tape account for the difference.`,
    parts: [
      slot('frame', 'lynskey-gr300'),
      custom('fork', 'Local Ti', 'Custom titanium gravel fork (12x100, flat mount)', 650, 780),
      slot('headset', 'cane-creek-40-zs44-zs56'),
      slot('wheels', 'dt-swiss-gr-1600-spline-25'),
      slot('tires', 'pirelli-cinturato-gravel-h'),
      slot('crankset', 'shimano-grx-rx820-1-crankset'),
      slot('bottomBracket', 'shimano-bb-mt800'),
      slot('chain', 'shimano-cn-m7100'),
      slot('cassette', 'shimano-deore-m6100-cassette'),
      slot('rearDerailleur', 'shimano-grx-rd-rx822-sgs'),
      slot('shifters', 'shimano-grx-st-rx820'),
      slot('brakes', 'shimano-grx-rx810-brakes'),
      slot('rotors', 'shimano-rt-cl800-160'),
      slot('handlebars', 'ritchey-wcs-venturemax'),
      slot('stem', 'redshift-shockstop-stem'),
      slot('seatpost', 'redshift-shockstop-seatpost'),
      slot('saddle', 'brooks-cambium-c17'),
      slot('pedals', 'shimano-pd-m520'),
    ],
    extras: [
      { name: 'Tailfin AP42 carbon rack', price: 330 },
      { name: 'Ortlieb Gravel-Pack panniers (pair)', price: 190 },
      { name: 'Full-length fenders', price: 65, notes: 'Planet Bike Cascadia ALX' },
      { name: 'Lezyne Macro + Strip light set', price: 110 },
    ],
  }),

  entry({
    id: 'coil-ripmo',
    author: 'loamhound',
    publishedAt: '2026-08-02T17:10:00Z',
    likes: 367,
    comments: 41,
    name: 'Coil Ripmo on Transmission',
    description: 'Ibis Ripmo V2S with a coil shock, a slacker headset and SRAM GX Transmission.',
    story: `
      The Ripmo is famously a "do everything" bike, which is code for "a little bit too polite" on the
      steep stuff I ride every weekend. So this build is about making it rowdier without losing the way
      it climbs.

      Three changes do most of the work. A Works Components angleset knocks 1.5° off the head angle; a
      160mm Lyrik Ultimate is the most fork the frame is rated for; and a Marzocchi Bomber CR coil
      replaces the stock Float X (which now lives on my partner's bike). The DW-link is supportive enough
      that the coil still pedals well, and it's glued to the ground on roots.

      Because the Ripmo has a UDH hanger I went straight to GX Eagle Transmission — two seasons in, I've
      had zero adjustments and one big rock strike that the derailleur just shrugged off. Code RSCs with
      200mm rotors, Industry Nine Hydras and Assegais front and rear round it out.`,
    parts: [
      slot('frame', 'ibis-ripmo-v2s'),
      slot('fork', 'rockshox-lyrik-ultimate'),
      slot('rearShock', 'marzocchi-bomber-cr-210x55'),
      slot('headset', 'works-components-angleset-zs44-zs56'),
      slot('wheels', 'industry-nine-hydra'),
      slot('tires', 'maxxis-assegai'),
      slot('crankset', 'sram-gx-t-type-crankset'),
      slot('bottomBracket', 'sram-dub-bb'),
      slot('chain', 'sram-gx-t-type-chain'),
      slot('cassette', 'sram-gx-t-type-xs-1275'),
      slot('rearDerailleur', 'sram-gx-t-type-rd'),
      slot('shifters', 'sram-axs-pod'),
      slot('brakes', 'sram-code-rsc'),
      slot('rotors', 'sram-hs2-200-6b'),
      slot('handlebars', 'deity-skywire-35'),
      slot('stem', 'deity-copperhead'),
      slot('seatpost', 'pnw-rainier-gen-4'),
      slot('saddle', 'ergon-smr3'),
      slot('pedals', 'chromag-dagga'),
    ],
    extras: [{ name: 'CushCore Pro inserts (pair)', price: 179 }],
  }),

  entry({
    id: 'campagnolo-mason',
    author: 'velo_veneziano',
    publishedAt: '2026-06-21T06:45:00Z',
    likes: 298,
    comments: 37,
    name: 'Super Record Mason',
    description: 'Mason Definition with Campagnolo Super Record 12 and Bora Ultra wheels.',
    actualWeightG: 7460,
    story: `
      I've ridden Campagnolo since I was a teenager and wasn't about to stop now. The Mason Definition
      is an aluminium frame, which raises eyebrows next to a Super Record groupset, but it rides beautifully,
      has a threaded BSA shell (Ultra-Torque cups thread straight in) and clears proper 28mm tires.

      Super Record 12 mechanical is still the nicest-feeling road shifting there is: you can dump three
      cogs at once with the thumb lever. The Bora Ultras use Campagnolo's N3W freehub, so the cassette and
      wheels had to match. The disc calipers aren't in the catalog, so I've added them as a custom part;
      Shimano Dura-Ace Center Lock rotors fit the AFS hubs fine.

      Deda's Alanera one-piece bar/stem keeps the front clean — note it replaces the stem entirely. Next
      on the list is a lighter saddle, but honestly this is the bike I'll be riding in ten years.`,
    parts: [
      slot('frame', 'mason-definition'),
      slot('fork', 'enve-ses-road-fork'),
      slot('headset', 'chris-king-inset-i2'),
      slot('wheels', 'campagnolo-bora-ultra'),
      slot('tires', 'michelin-power-cup-tlr'),
      slot('crankset', 'campagnolo-super-record-12'),
      slot('bottomBracket', 'campagnolo-ultra-torque-bsa'),
      slot('chain', 'campagnolo-super-record-12-chain'),
      slot('cassette', 'campagnolo-super-record-12-cassette'),
      slot('rearDerailleur', 'campagnolo-super-record-12-rd'),
      slot('frontDerailleur', 'campagnolo-super-record-12-fd'),
      slot('shifters', 'campagnolo-super-record-12-ergopower'),
      custom('brakes', 'Campagnolo', 'Super Record Disc flat-mount calipers (pair)', 420, 290),
      slot('rotors', 'shimano-rt-cl900-160'),
      slot('handlebars', 'deda-alanera-dcr'),
      slot('seatpost', 'thomson-elite-setback'),
      slot('saddle', 'selle-italia-flite-boost'),
      slot('pedals', 'look-keo-blade-carbon'),
    ],
  }),

  entry({
    id: 'steamroller-city-fixie',
    author: 'track_stand_tom',
    publishedAt: '2026-04-09T19:20:00Z',
    likes: 241,
    comments: 63,
    name: 'Steamroller City Fixed',
    description: 'A Surly Steamroller fixed gear for city riding, with a front brake.',
    story: `
      Every city rider should own a fixed gear at least once. The Steamroller is the sensible way to do
      it: steel, track ends, and — unlike a real track frame — drilled for a brake, so it's legal on the
      road. I run a front caliper only; the 105 set came as a pair and the rear is in a drawer.

      The State Bicycle Deep V wheels have a flip-flop hub, so I've got a 17T fixed cog on one side and
      could fit a freewheel on the other if my knees ever complain. The Miche track crank is a lovely
      piece of kit for the money, on a cheap square-taper BB. Gatorskins because I'm sick of fixing flats
      on the way to work.

      Bullhorns and a long, low stem make it feel properly aggressive, with one Tektro RL340 lever on the
      right horn for the front brake. Total cost was under $1,900 with the extras, and it's the bike that
      gets ridden most days.`,
    parts: [
      slot('frame', 'surly-steamroller'),
      slot('fork', 'soma-track-fork'),
      slot('headset', 'fsa-orbit-mx'),
      slot('wheels', 'state-bicycle-co-deep-v-wheelset'),
      slot('tires', 'continental-gatorskin'),
      slot('crankset', 'miche-primato-advanced-track-crankset'),
      slot('bottomBracket', 'shimano-bb-un300'),
      slot('chain', 'izumi-super-toughness-kai-chain'),
      slot('sprocket', 'all-city-track-cog'),
      slot('brakes', 'shimano-105-r7000-rim'),
      slot('brakeLevers', 'tektro-rl340'),
      slot('handlebars', 'origin8-pursuit-bullhorn'),
      slot('stem', 'ritchey-comp-4-axis-17'),
      slot('seatpost', 'ritchey-comp-2-bolt'),
      slot('saddle', 'brooks-b17'),
      custom('pedals', 'MKS', 'Sylvan Track pedals', 95, 360),
    ],
    extras: [
      { name: 'Double toe straps', price: 30 },
      { name: 'U-lock', price: 85, notes: 'Kryptonite Evolution Mini-7' },
    ],
  }),

  entry({
    id: 'budget-rootdown',
    author: 'dirtbag_dani',
    publishedAt: '2026-07-11T12:00:00Z',
    likes: 186,
    comments: 29,
    name: 'Budget Steel Rootdown',
    description: 'Chromag Rootdown hardtail on a budget — Shimano CUES 1x11 and a 170mm coil fork.',
    story: `
      I wanted a steel hardtail I could ride hard without worrying about money, and the Rootdown is the
      one everyone recommends. The rest of the build is about putting money where it matters.

      Yes, the fork is 170mm and the frame is rated for 150 — the builder flags it and I knew going in.
      I sag it a bit more than usual and the geometry is still sane; it's a deliberate choice for the
      bike park. Shimano CUES 1x11 is the drivetrain bargain of the decade: Linkglide shifts under load
      without complaint and the whole groupset cost less than one Transmission derailleur.

      Deore four-piston brakes with 203mm Galfer rotors, an HG-driver DT Swiss wheelset and a PNW dropper
      round it out. Next upgrade is a Chromag saddle when my current one dies.`,
    parts: [
      slot('frame', 'chromag-rootdown'),
      slot('fork', 'marzocchi-bomber-z1-coil'),
      slot('headset', 'wolf-tooth-performance-zs44-ec44'),
      slot('wheels', 'dt-swiss-m-1900-spline-30'),
      slot('tires', 'maxxis-minion-dhf'),
      slot('crankset', 'shimano-cues-u6000-crankset'),
      slot('bottomBracket', 'shimano-bb-mt800'),
      slot('chain', 'shimano-cn-lg500'),
      slot('cassette', 'shimano-cues-lg600-11-cassette'),
      slot('rearDerailleur', 'shimano-cues-rd-u6000-11'),
      slot('shifters', 'shimano-cues-sl-u6000-11r'),
      slot('brakes', 'shimano-deore-m6120'),
      slot('rotors', 'galfer-shark-203-6b'),
      slot('handlebars', 'chromag-bza-35'),
      slot('stem', 'chromag-hifi-stem'),
      slot('seatpost', 'pnw-rainier-gen-4'),
      slot('saddle', 'sdg-bel-air-3'),
      slot('pedals', 'dmr-vault'),
    ],
  }),

  entry({
    id: 'featherweight-r5',
    author: 'grams_matter',
    publishedAt: '2026-05-30T05:15:00Z',
    likes: 335,
    comments: 72,
    name: 'Featherweight Cervélo R5',
    description: 'Cervélo R5 with SRAM Red AXS E1 and DT Swiss ARC 1100 wheels. Weighed on a hanging scale.',
    actualWeightG: 6720,
    story: `
      Yes, I'm one of those people. This build started as a challenge to see how light I could get a
      disc-brake road bike while keeping it a bike I'd actually ride — so no glued-on tubulars, no
      drilled bolts, normal bar tape.

      The R5 frameset comes with Cervélo's proprietary seatpost, so there's no seatpost slot here. SRAM
      Red AXS E1 is the lightest complete road group, the 48/35 crank has a power meter built in, and the
      10-33 cassette needs the XDR driver the ARC 1100s ship with. Vision's Metron 5D one-piece bar/stem
      saves a few grams and a lot of cables. 140mm rotors front and rear are fine for my weight.

      On the shop's hanging scale it came in at 6.72kg with pedals and two bottle cages — a touch
      heavier than the builder estimate thanks to tape, cages and sealant. Not quite UCI-illegal, but
      close.`,
    parts: [
      slot('frame', 'cervelo-r5'),
      slot('fork', 'enve-ses-road-fork'),
      slot('headset', 'hope-integrated-is41-is52'),
      slot('wheels', 'dt-swiss-arc-1100-xdr'),
      slot('tires', 'vittoria-corsa-pro'),
      slot('crankset', 'sram-red-axs-crankset'),
      slot('bottomBracket', 'sram-dub-pf30-bb'),
      slot('chain', 'sram-red-chain-120'),
      slot('cassette', 'sram-red-xg-1290'),
      slot('rearDerailleur', 'sram-red-axs-e1-rd'),
      slot('frontDerailleur', 'sram-red-axs-e1-fd'),
      slot('shifters', 'sram-red-axs-e1-hrd-levers'),
      slot('brakes', 'sram-red-etap-hrd'),
      slot('rotors', 'sram-centerline-140-cl'),
      slot('handlebars', 'vision-metron-5d-acr'),
      slot('saddle', 'selle-italia-slr-boost-carbonio'),
      slot('pedals', 'wahoo-speedplay-zero'),
    ],
    extras: [{ name: 'Carbon bottle cages (pair)', price: 90, notes: '18g each' }],
  }),

  entry({
    id: 'road-logic-classic',
    author: 'steel_is_real_77',
    publishedAt: '2025-11-03T15:40:00Z',
    likes: 154,
    comments: 22,
    name: 'Road Logic Rim-Brake Classic',
    description: 'Ritchey Road Logic steel with 11-speed 105 rim brakes — the way road bikes used to be.',
    story: `
      Rim brakes and quick releases aren't dead; they're just cheap now. I built this Ritchey Road Logic
      from a mix of new-old-stock 105 R7000 and parts bin bits, and it's the best-riding bike I own.

      Everything is 11-speed 105: 50/34 crank, 11-32 cassette, medium-cage derailleur and the classic
      dual-pivot calipers. Mavic Ksyriums are bombproof rim-brake wheels. The frame clears 30mm tires but
      the Ritchey carbon fork stops at 28, so I run 25mm GP5000s.

      One wrinkle the builder points out: the Road Logic has a clamp-on front derailleur mount and the
      105 FD is braze-on. A $20 clamp adapter band (listed as an extra) sorts it — it's how everyone runs
      these.`,
    parts: [
      slot('frame', 'ritchey-road-logic'),
      slot('fork', 'ritchey-wcs-carbon-road-fork'),
      slot('headset', 'chris-king-nothreadset'),
      slot('wheels', 'mavic-ksyrium-sl'),
      slot('tires', 'continental-gp5000-clincher'),
      slot('crankset', 'shimano-105-r7000-crankset'),
      slot('bottomBracket', 'shimano-bb-r9100'),
      slot('chain', 'kmc-x11-chain'),
      slot('cassette', 'shimano-105-r7000-cassette'),
      slot('rearDerailleur', 'shimano-105-rd-r7000-gs'),
      slot('frontDerailleur', 'shimano-105-fd-r7000'),
      slot('shifters', 'shimano-105-st-r7000'),
      slot('brakes', 'shimano-105-r7000-rim'),
      slot('handlebars', 'zipp-service-course-80'),
      slot('stem', 'ritchey-wcs-c220'),
      slot('seatpost', 'ritchey-wcs-carbon-link-flexlogic'),
      slot('saddle', 'fizik-arione-r3'),
      slot('pedals', 'look-keo-classic-3'),
    ],
    extras: [{ name: 'Braze-on FD clamp adapter (31.8mm)', price: 20 }],
  }),

  entry({
    id: 'epic-hardtail-xc',
    author: 'marathon_mira',
    publishedAt: '2026-03-18T09:00:00Z',
    likes: 203,
    comments: 18,
    name: 'XC Marathon Epic HT',
    description: 'S-Works Epic Hardtail race bike — XX1 Eagle AXS, SID SL and Roval carbon.',
    actualWeightG: 8640,
    story: `
      Built for 100km marathon races, where a hardtail still makes sense. The S-Works Epic Hardtail frame
      is under 800g and has a threaded BB — I've had enough creaking press-fits for one lifetime.

      The drivetrain is XX1 Eagle AXS rather than Transmission, because the Epic HT doesn't have a UDH
      hanger. Honestly I don't miss it: the rocker controller is great and the 10-52 cassette is the same.
      XTR two-piston brakes with 180mm rotors are light and plenty for XC.

      I run a rigid Thomson post because the races I do don't need a dropper. Real-world weight is 8.64kg
      with sealant and two cages.`,
    parts: [
      slot('frame', 'specialized-s-works-epic-hardtail'),
      slot('fork', 'rockshox-sid-sl-ultimate'),
      slot('headset', 'cane-creek-110-is42-is52'),
      slot('wheels', 'roval-control-sl'),
      slot('tires', 'maxxis-rekon-race'),
      slot('crankset', 'sram-x01-eagle-crankset'),
      slot('bottomBracket', 'sram-dub-bb'),
      slot('chain', 'sram-x01-eagle-chain'),
      slot('cassette', 'sram-xx1-eagle-xg-1299'),
      slot('rearDerailleur', 'sram-xx1-eagle-axs-rd'),
      slot('shifters', 'sram-eagle-axs-rocker-controller'),
      slot('brakes', 'shimano-xtr-m9100'),
      slot('rotors', 'galfer-wave-180-6b'),
      slot('handlebars', 'oneup-carbon-bar'),
      slot('stem', 'race-face-turbine-r-35-stem'),
      slot('seatpost', 'thomson-elite-inline-30-9'),
      slot('saddle', 'fizik-vento-antares-r1'),
      slot('pedals', 'crankbrothers-eggbeater-3'),
    ],
  }),

  entry({
    id: 'supreme-dh-race',
    author: 'braaap_collective',
    publishedAt: '2025-09-27T14:25:00Z',
    likes: 177,
    comments: 34,
    name: 'Supreme DH Race Rig',
    description: 'Commencal Supreme DH V5 with a Fox 40, SuperBoost DT Swiss wheels and Saint brakes.',
    story: `
      Race bike for the regional downhill series. The Supreme DH V5 comes with a DHX2 coil, so the build
      is everything else. The big gotcha is the 12x157mm SuperBoost rear end — the DT Swiss FR 1500
      Classic is one of the few off-the-shelf wheelsets that fits, and it's tough as nails.

      Up front is a Fox 40 Factory. It has a straight 1-1/8" steerer, so the headset is Cane Creek's
      ZS44/ZS56 with a straight-steerer lower cup. Saint four-piston brakes with 203mm Hope floating
      rotors, and Michelin DH22s in the proper downhill casing.

      Drivetrain is mechanical GX Eagle with an NX cassette — on a DH bike you only use five gears and
      they all get smashed eventually. Chain guide is listed as an extra.`,
    parts: [
      slot('frame', 'commencal-supreme-dh-v5'),
      slot('fork', 'fox-40-factory'),
      slot('headset', 'cane-creek-40-zs44-zs56-straight'),
      slot('wheels', 'dt-swiss-fr-1500-classic'),
      slot('tires', 'michelin-dh22'),
      slot('crankset', 'sram-gx-eagle'),
      slot('bottomBracket', 'sram-dub-bb'),
      slot('chain', 'sram-gx-eagle-chain'),
      slot('cassette', 'sram-nx-eagle-pg-1230'),
      slot('rearDerailleur', 'sram-gx-eagle-rd'),
      slot('shifters', 'sram-gx-eagle-trigger'),
      slot('brakes', 'shimano-saint-m820'),
      slot('rotors', 'hope-floating-203-6b'),
      slot('handlebars', 'renthal-fatbar-31-8'),
      slot('stem', 'race-face-aeffect-r-stem'),
      slot('seatpost', 'race-face-aeffect-seatpost-31-6'),
      slot('saddle', 'sdg-bel-air-3'),
      slot('pedals', 'crankbrothers-mallet-e'),
    ],
    extras: [{ name: 'OneUp V2 chain guide (ISCG05)', price: 150 }],
  }),

  entry({
    id: 'ekar-zydeco',
    author: 'strade_bianche_sam',
    publishedAt: '2025-12-12T10:05:00Z',
    likes: 129,
    comments: 15,
    name: 'Ekar 13-Speed Zydeco',
    description: 'Cinelli Zydeco with Campagnolo Ekar 1x13 and custom Campagnolo Levante wheels.',
    story: `
      Italian frame, Italian groupset, Italian wheels. The Cinelli Zydeco is a fun, slightly racy
      aluminium gravel frame with a threaded BSA shell, so Ekar's Ultra-Torque crank threads right in.

      Ekar is 13-speed with a 10-44 cassette — tiny jumps for a 1x and plenty of range with a 40T ring.
      The Levante wheels use Campagnolo's N3W freehub; they're not in the catalog yet, so I've added
      them as a custom part. Campagnolo's hydraulic levers use mineral oil, so I paired them with Shimano
      GRX calipers and Center Lock rotors, which were half the price of the Campagnolo ones.

      40mm G-One R Pros are the max the frame takes. Next: a dropper for the descents.`,
    parts: [
      slot('frame', 'cinelli-zydeco'),
      slot('fork', 'salsa-firestarter-carbon'),
      slot('headset', 'cane-creek-40-zs44-zs56'),
      custom('wheels', 'Campagnolo', 'Levante 700c carbon wheelset (N3W)', 1650, 1490),
      slot('tires', 'schwalbe-g-one-r-pro'),
      slot('crankset', 'campagnolo-ekar-crankset'),
      slot('bottomBracket', 'campagnolo-ultra-torque-bsa'),
      slot('chain', 'campagnolo-ekar-chain'),
      slot('cassette', 'campagnolo-ekar-cassette'),
      slot('rearDerailleur', 'campagnolo-ekar-rd'),
      slot('shifters', 'campagnolo-ekar-ergopower'),
      slot('brakes', 'shimano-grx-rx810-brakes'),
      slot('rotors', 'shimano-rt-cl800-160'),
      slot('handlebars', 'zipp-service-course-70-xplr'),
      slot('stem', 'zipp-service-course-sl-stem'),
      slot('seatpost', 'pro-discover-carbon-seatpost'),
      slot('saddle', 'fabric-scoop-shallow-pro'),
      slot('pedals', 'crankbrothers-eggbeater-3'),
    ],
  }),

  entry({
    id: 'process-153-27',
    author: 'pnw_shredder',
    publishedAt: '2025-06-08T18:50:00Z',
    likes: 112,
    comments: 26,
    name: 'Kona Process 153 27.5',
    description: 'A 27.5" Kona Process 153 with a DBcoil, Bomber Z1 and Magura brakes.',
    story: `
      The Process 153 is one of the last great 27.5" enduro bikes, and I wasn't ready to give up on
      small wheels. It's a playful bike that loves to jump.

      I swapped the stock Super Deluxe for a Cane Creek DBcoil in the same 230x60 size, and it's
      transformed the rear end. Up front a 150mm Marzocchi Bomber Z1 in 27.5". The Race Face Aeffect R
      crank uses a 30mm spindle, so the BB is Race Face's BSA30.

      Drivetrain is NX Eagle — cheap, heavy, works. Magura MT5e four-piston brakes with 203mm Galfer
      rotors are the best value brakes I've used. Minion DHFs front and rear.`,
    parts: [
      slot('frame', 'kona-process-153'),
      slot('fork', 'marzocchi-bomber-z1-27'),
      slot('rearShock', 'cane-creek-dbcoil'),
      slot('headset', 'cane-creek-40-zs44-zs56'),
      slot('wheels', 'race-face-aeffect-r-30-275'),
      slot('tires', 'maxxis-minion-dhf-275'),
      slot('crankset', 'race-face-aeffect-r-crankset'),
      slot('bottomBracket', 'race-face-bsa30-bb'),
      slot('chain', 'sram-nx-eagle-chain'),
      slot('cassette', 'sram-nx-eagle-pg-1230'),
      slot('rearDerailleur', 'sram-nx-eagle-rd'),
      slot('shifters', 'sram-nx-eagle-trigger'),
      slot('brakes', 'magura-mt5e'),
      slot('rotors', 'galfer-shark-203-6b'),
      slot('handlebars', 'race-face-chester-31-8-bar'),
      slot('stem', 'race-face-aeffect-r-stem'),
      slot('seatpost', 'fox-transfer-factory'),
      slot('saddle', 'wtb-silverado-team'),
      slot('pedals', 'race-face-chester-pedal'),
    ],
  }),

  entry({
    id: 'brakeless-tierra',
    author: 'curb_cutter',
    publishedAt: '2025-04-19T16:30:00Z',
    likes: 97,
    comments: 12,
    name: 'Brakeless Fly Tierra',
    description: 'Fly Bikes Tierra street BMX, brakeless, with a 25/9 gear.',
    story: `
      Street BMX, no brakes, nothing fancy. The Fly Tierra has a Spanish BB shell, so I've got Profile's
      19mm Spanish BB and their Race cranks — they'll outlive me.

      Mission Deploy wheels have a 9T cassette driver; with a 25T sprocket that's the classic street
      gear. Path Pro tires, S&M Race XLT bars on an Odyssey top-load stem, and a pivotal seat.

      Removed the U-brake mounts the first week. Pegs are listed as extras.`,
    parts: [
      slot('frame', 'fly-bikes-tierra'),
      slot('fork', 'odyssey-r32-fork'),
      slot('headset', 'fsa-orbit-mx'),
      slot('wheels', 'mission-deploy-wheelset'),
      slot('tires', 'odyssey-path-pro'),
      slot('crankset', 'profile-racing-race-crankset'),
      slot('bottomBracket', 'profile-racing-spanish-bb-19'),
      slot('chain', 'kmc-z510hx-chain'),
      slot('sprocket', 'salt-plus-driver-9t'),
      slot('handlebars', 'sm-race-xlt-bar'),
      slot('stem', 'odyssey-elementary-v3-stem'),
      slot('seatpost', 'odyssey-pivotal-seatpost'),
      slot('saddle', 'odyssey-mid-pivotal-seat'),
      slot('pedals', 'odyssey-twisted-pc'),
    ],
    extras: [{ name: 'Odyssey Graduate pegs (x2)', price: 40 }],
  }),
  entry({
    id: 'sklar-pbj-hbar',
    author: 'tallgrass_tom',
    publishedAt: '2026-03-14T17:20:00Z',
    likes: 88,
    comments: 14,
    name: 'Sklar PBJ Loop-Bar Trail Hardtail',
    description: 'Sklar PBJ steel hardtail with its matching rigid fork, a Jones Loop H-Bar, Deore 12-speed and XT wheels.',
    story: `
      Adam Sklar builds these in Bozeman, and I waited nine months for mine. It came to $1,600 for the
      frame and fork, which is fair for a hand-built bike with paint like this. The PBJ is meant to run
      a suspension fork, but I went with the matching rigid fork and put the money into fat 29x2.4 DHR IIs
      and a Jones Loop H-Bar. On 30mm XT rims at 17 psi it rides much softer than you'd think.

      The drivetrain is 1x12 Deore M6100, so nothing fancy, and it shifts just as well as my old XT. The
      frame tops out at 160mm rotors, so it has XT RT-MT800 rotors front and rear with Deore four-pot
      M6120 calipers to make up for it. It also has a PNW Rainier dropper, because even on a rigid bike
      it's nice to drop the saddle out of the way.

      A Thomson X4 holds the Loop bar, and with a 70mm stem it's the most comfortable bike I've ever owned
      for long days. Frame bags are listed as extras.`,
    actualWeightG: 13150,
    parts: [
      slot('frame', 'sklar-pbj-frame'),
      slot('fork', 'sklar-pbj-fork'),
      slot('headset', 'cane-creek-40-ec34-ec44-straight'),
      slot('wheels', 'shimano-xt-wh-m8120'),
      slot('tires', 'maxxis-minion-dhr-ii'),
      slot('crankset', 'shimano-deore-m6100-crankset'),
      slot('bottomBracket', 'shimano-bb-mt800'),
      slot('chain', 'shimano-deore-cn-m6100'),
      slot('cassette', 'shimano-deore-m6100-cassette'),
      slot('rearDerailleur', 'shimano-deore-rd-m6100'),
      slot('shifters', 'shimano-deore-sl-m6100'),
      slot('brakes', 'shimano-deore-m6120'),
      slot('rotors', 'shimano-rt-mt800-160'),
      slot('handlebars', 'jones-loop-h-bar-aluminum'),
      slot('stem', 'thomson-x4'),
      slot('seatpost', 'pnw-rainier-gen-4'),
      slot('saddle', 'wtb-silverado-team'),
      slot('pedals', 'mks-lambda'),
    ],
    extras: [
      { name: 'Revelate Designs Tangle frame bag', price: 110 },
      { name: 'Jones H-Bar bag', price: 70 },
    ],
  }),

  entry({
    id: 'crust-scapegoat-plus',
    author: 'goatpath',
    publishedAt: '2026-04-02T13:10:00Z',
    likes: 71,
    comments: 19,
    name: 'Crust Scapegoat 27.5+ Bikepacker',
    description:
      'Crust Scapegoat on 27.5x3.0 WTB Bridgers with Deore 1x11. The frame and fork are IS-mount, so the post-mount Deore calipers use IS adapters front and rear. That accounts for the two brake-mount warnings.',
    story: `
      I bought the Scapegoat frame and fork used for $850, because I wanted a rigid steel bike that can
      take 3" tires and carry a pile of gear. Crust uses old-school IS disc mounts at both ends. Nobody
      really makes IS calipers anymore, so I used Deore M6120 post-mount brakes with Shimano IS-to-post
      adapters (SM-MA-F180P/S up front and SM-MA-R160P/S out back). The builder flags these as brake-mount
      warnings, and that's expected. The adapters are a $15 fix and they've been totally fine.

      The wheels are Race Face AEffect R 30s, with 30mm internal rims and Boost spacing. I have WTB
      Bridgers set up tubeless at about 10 psi. I picked Deore M5100 1x11 for the 11-51 range and because
      it works on a standard HG freehub, and with a 30T ring I can winch up anything with a full load.

      I run a Surly Sunrise bar on a Paul Boxcar stem with a 31.6 Race Face post. Galfer 180mm rotors are
      as big as the frame allows. Anything-cage mounts on the fork carry the tent and the cook kit.`,
    actualWeightG: 14900,
    parts: [
      slot('frame', 'crust-scapegoat-frame'),
      slot('fork', 'crust-scapegoat-fork'),
      slot('headset', 'velo-orange-grand-cru-threadless-1-1-8'),
      slot('wheels', 'race-face-aeffect-r-30-275'),
      slot('tires', 'wtb-bridger-27-5x3'),
      slot('crankset', 'shimano-deore-fc-m5100-1-crankset'),
      slot('bottomBracket', 'shimano-sm-bb52'),
      slot('chain', 'kmc-x11-chain'),
      slot('cassette', 'shimano-deore-cs-m5100-11-cassette'),
      slot('rearDerailleur', 'shimano-deore-rd-m5100-sgs'),
      slot('shifters', 'shimano-deore-sl-m5100-r'),
      slot('brakes', 'shimano-deore-m6120'),
      slot('rotors', 'galfer-wave-180-6b'),
      slot('handlebars', 'surly-sunrise-bar'),
      slot('stem', 'paul-boxcar-stem'),
      slot('seatpost', 'race-face-aeffect-seatpost-31-6'),
      slot('saddle', 'wtb-volt-chromoly'),
      slot('pedals', 'mks-lambda'),
    ],
    extras: [
      { name: 'Shimano IS-to-post-mount adapters (front 180 + rear 160)', price: 30 },
      { name: 'Salsa Anything Cage HD (x2)', price: 70 },
    ],
  }),

  entry({
    id: 'rivendell-clem-smith-jr',
    author: 'wool_and_wax',
    publishedAt: '2026-05-21T08:45:00Z',
    likes: 64,
    comments: 22,
    name: 'Rivendell Clem Smith Jr. Do-Everything',
    description: 'Rivendell Clem Smith Jr. on 26x2.3 Rat Trap Pass tires with a 9-speed triple, friction thumbies and Deore V-brakes.',
    story: `
      The Clem is Rivendell's cheapest bike and probably its best. I got a lightly used frameset in the
      Rivendell Facebook group for $700 and built it up from my parts bin plus some new stuff. It runs
      26" wheels, because then it takes the Rene Herse Rat Trap Pass 2.3s with lots of room left over for
      fenders.

      The drivetrain is a Sugino XD600 triple with a Tange square-taper BB, and the cassette is a 9-speed
      HG400 11-36. That gets me a 24x36 low gear, which is plenty for errands with a full basket. I shift
      it with Rivendell Silver2 friction thumbies, which take zero fussing. The rear derailleur is a Deore
      M592 Shadow and the front is an XT trekking FD.

      For brakes I used Deore T610 V-brakes. The set comes with matching levers, it's cheap, and it stops
      well in the rain. Up front is a Nitto Bosco bar on a Technomic quill stem, with a B17 on a Nitto
      Crystal Fellow post, so the saddle sits about level with the bar. Wald basket and Honjo fenders are
      listed as extras.`,
    actualWeightG: 14200,
    parts: [
      slot('frame', 'rivendell-clem-smith-jr-frame'),
      slot('fork', 'rivendell-clem-smith-jr-fork'),
      slot('headset', 'tange-levin-cds-1in-threaded'),
      slot('wheels', 'sun-ringle-rhyno-lite-26-wheels'),
      slot('tires', 'rene-herse-rat-trap-pass-26x2-3'),
      slot('crankset', 'sugino-xd600-triple-crankset'),
      slot('bottomBracket', 'tange-ln-7922-68x122'),
      slot('chain', 'kmc-x9-chain'),
      slot('cassette', 'shimano-cs-hg400-9-cassette'),
      slot('frontDerailleur', 'shimano-deore-xt-fd-t8000'),
      slot('rearDerailleur', 'shimano-deore-rd-m592-sgs'),
      slot('shifters', 'rivendell-silver2-thumb-shifters'),
      slot('brakes', 'shimano-deore-t610-v-brake'),
      slot('handlebars', 'nitto-bosco-bar'),
      slot('stem', 'nitto-technomic-stem'),
      slot('seatpost', 'nitto-s83-crystal-fellow-27-2'),
      slot('saddle', 'brooks-b17'),
      slot('pedals', 'mks-sylvan-touring'),
    ],
    extras: [
      { name: 'Wald 137 basket', price: 35 },
      { name: 'Honjo hammered fenders (26")', price: 95 },
    ],
  }),

  entry({
    id: 'jones-lwb-loop',
    author: 'jeffs_disciple',
    publishedAt: '2026-06-09T19:30:00Z',
    likes: 93,
    comments: 27,
    name: 'Jones LWB Spaceframe 29x3',
    description:
      'Jones Steel Plus LWB spaceframe on 29x3.0 Chronicles with XT 12-speed and the Loop H-Bar. The Jones fork is a custom part. The rear IS mount takes a post-mount XT caliper on an adapter, which accounts for the one brake-mount warning.',
    story: `
      This one's a full Jones-kool-aid build. The LWB spaceframe is the longest, slackest Jones they make,
      and it's built for 29x3 tires. I paid $1,100 for the frame and $350 for the matching Jones steel
      unicrown fork. The fork isn't in the catalog, so it's a custom part. It's a Boost 15x110 with an IS
      mount, like the frame.

      The frame's rear brake mount is IS too. I run XT M8120 four-pot brakes, which are post-mount, so I
      used a Shimano IS adapter in back (the warning in the builder is just that), and another adapter
      on the fork. With 180mm XT rotors it stops a loaded bike on long descents without fading.

      The wheels are Shimano XT M8120s. They have 30mm internal rims and a Microspline driver, so I could
      run full 1x12 XT. I didn't want to give up the 10-51 range for big days. Maxxis Chronicle 29x3s at
      12 psi are the suspension.

      The cockpit is the Jones Loop H-Bar in aluminum on a Thomson X4, which is the only way to ride this
      bike. A Brooks Cambium sits on a Ritchey 27.2 two-bolt post. The Jones H-bar bag and frame pack are
      listed as extras.`,
    actualWeightG: 14400,
    parts: [
      slot('frame', 'jones-steel-plus-lwb-spaceframe'),
      custom('fork', 'Jones', 'Steel Unicrown Fork (29+, 15x110 Boost, IS)', 350, 1250),
      slot('headset', 'chris-king-nothreadset'),
      slot('wheels', 'shimano-xt-wh-m8120'),
      slot('tires', 'maxxis-chronicle-29x3'),
      slot('crankset', 'shimano-xt-m8100-crankset'),
      slot('bottomBracket', 'shimano-bb-mt800'),
      slot('chain', 'shimano-cn-m8100'),
      slot('cassette', 'shimano-xt-m8100-cassette'),
      slot('rearDerailleur', 'shimano-xt-rd-m8100'),
      slot('shifters', 'shimano-xt-sl-m8100'),
      slot('brakes', 'shimano-xt-m8120'),
      slot('rotors', 'shimano-rt-mt800-180'),
      slot('handlebars', 'jones-loop-h-bar-aluminum'),
      slot('stem', 'thomson-x4'),
      slot('seatpost', 'ritchey-classic-2-bolt-seatpost-27-2'),
      slot('saddle', 'brooks-cambium-c17'),
      slot('pedals', 'shimano-xt-pd-m8120'),
    ],
    extras: [
      { name: 'Shimano IS-to-post-mount adapters (front + rear)', price: 30 },
      { name: 'Jones H-Bar bag + spaceframe pack', price: 160 },
    ],
  }),

  entry({
    id: 'bmc-mcd-monstercross',
    author: 'dirt_road_dan',
    publishedAt: '2026-07-11T15:00:00Z',
    likes: 58,
    comments: 11,
    name: 'Black Mountain MCD Monstercross',
    description:
      'Black Mountain Cycles MCD with BB7 mechanical discs, 10-speed bar-ends and 700x44 Snoqualmie Pass tires. The MCD frame and fork are IS-mount, so the post-mount BB7s use IS adapters. That accounts for the two brake-mount warnings.',
    story: `
      Mike at Black Mountain sold me the MCD frame and fork for $720 shipped, and it's the best money I've
      spent on a bike. It's a steel monstercross with 12mm thru-axles and old-school IS disc mounts at
      both ends.

      For brakes I went with Avid BB7 MTB calipers, which are long pull, so they're run by Tektro RL520
      long-pull drop levers. The BB7s are post-mount and the frame is IS, so there's an IS adapter at each
      end. The builder shows a brake-mount warning for each, which is expected. The 160mm Centerline
      rotors are as big as the frame allows.

      Shifting is Microshift 10-speed bar-ends running a 105 5700 GS rear derailleur and an 11-28
      cassette. The front derailleur is a braze-on 105 on a clamp adapter. The Sugino OX601D 46/30 crank
      gives me a low enough gear for fire roads. The Velo Orange thru-axle wheels need a 1.85mm spacer
      behind the 10-speed cassette, which the builder notes.

      I'm on Rene Herse Snoqualmie Pass 700x44s, the most tire that fits. With a Salsa Cowbell bar it
      feels like a drop-bar mountain bike, which is the whole point.`,
    actualWeightG: 11300,
    parts: [
      slot('frame', 'black-mountain-cycles-mcd-frame'),
      slot('fork', 'black-mountain-cycles-mcd-fork'),
      slot('headset', 'velo-orange-grand-cru-threadless-1-1-8'),
      slot('wheels', 'velo-orange-voyager-disc-700c-ta-wheels'),
      slot('tires', 'rene-herse-snoqualmie-pass-700x44'),
      slot('crankset', 'sugino-ox601d-crankset'),
      slot('bottomBracket', 'velo-orange-grand-cru-sealed-bb-68x110'),
      slot('chain', 'kmc-x10-chain'),
      slot('cassette', 'shimano-105-cs-5700-cassette'),
      slot('frontDerailleur', 'shimano-105-fd-5700-f'),
      slot('rearDerailleur', 'shimano-105-rd-5700-gs'),
      slot('shifters', 'microshift-bs-m10-bar-end-shifters'),
      slot('brakes', 'avid-bb7-mtb'),
      slot('brakeLevers', 'tektro-rl520'),
      slot('rotors', 'sram-centerline-160-6b'),
      slot('handlebars', 'salsa-cowbell-3'),
      slot('stem', 'salsa-guide-deluxe-stem'),
      slot('seatpost', 'nitto-s83-crystal-fellow-27-2'),
      slot('saddle', 'wtb-volt-chromoly'),
      slot('pedals', 'shimano-pd-m520'),
    ],
    extras: [
      { name: 'Avid IS-to-post-mount adapters (x2)', price: 24 },
      { name: 'Braze-on FD clamp adapter (28.6mm)', price: 12 },
    ],
  }),

  entry({
    id: 'yo-eddy-1994',
    author: 'somerville_steel',
    publishedAt: '2026-02-08T21:15:00Z',
    likes: 146,
    comments: 41,
    name: '1994 Fat Chance Yo Eddy! — XTR M900',
    description: 'Period-correct 1994 Fat Chance Yo Eddy! with an XTR M900 group, a RockShox Mag 21 SL, Grip Shift and an Onza Porcupine.',
    story: `
      I found this Yo Eddy on Craigslist in Somerville, of all places, for $650. It was a team-fade frame
      with a seized post and a Mag 21 that hadn't been serviced since Clinton. After two years of
      collecting parts it's back to how I imagine it rolled out of the shop in '94.

      The rear derailleur, front derailleur and 12-28 cassette are XTR M900, and the cantilevers are XTR
      too. I sourced them one piece at a time on eBay for about $380 total, and they still shift and stop
      like new. A Grip Shift SRT-600 does the shifting, since that was the hot setup that year. The crank
      is an XT M737 Compact Drive on a UN72 BB, because a clean M900 crank costs more than the frame did.

      The Mag 21 SL got new elastomers and seals and works fine. Bars and stem are an Answer Hyperlite on
      a Kalloy 1-1/8" quill, and the post is a Kalloy 29.4, which was the only one I could find in that
      oddball size. Onza Porcupines, Dia-Compe SS-6 levers and a Flite saddle round it out.

      I ride it on the Middlesex Fells trails once a month and get thumbs-ups every time.`,
    actualWeightG: 11200,
    parts: [
      slot('frame', 'fat-chance-yo-eddy-1994'),
      slot('fork', 'rockshox-mag-21-sl-fork-1-1-8-threaded'),
      slot('headset', 'tioga-avenger-headset-1-1-8'),
      slot('wheels', 'shimano-xt-m737-mavic-217-wheels-26'),
      slot('tires', 'onza-porcupine-26x2-1'),
      slot('crankset', 'shimano-deore-xt-fc-m737-crankset'),
      slot('bottomBracket', 'shimano-deore-xt-bb-un72-73x113'),
      slot('chain', 'kmc-x8-chain'),
      slot('cassette', 'shimano-xtr-cs-m900-cassette'),
      slot('frontDerailleur', 'shimano-xtr-fd-m900'),
      slot('rearDerailleur', 'shimano-xtr-rd-m900'),
      slot('shifters', 'grip-shift-srt-600'),
      slot('brakes', 'shimano-xtr-br-m900-cantilever'),
      slot('brakeLevers', 'dia-compe-ss-6'),
      slot('handlebars', 'answer-hyperlite-flat-bar'),
      slot('stem', 'kalloy-quill-stem-1-1-8'),
      slot('seatpost', 'kalloy-seatpost-29-4'),
      slot('saddle', 'selle-italia-flite-1990'),
      slot('pedals', 'shimano-deore-xt-pd-m737'),
    ],
    extras: [{ name: 'Onza bar ends', price: 25 }],
  }),

  entry({
    id: 'gt-zaskar-1995',
    author: 'triple_triangle',
    publishedAt: '2026-08-17T11:40:00Z',
    likes: 103,
    comments: 25,
    name: '1995 GT Zaskar — XT Restomod',
    description: '1995 GT Zaskar with a RockShox Judy XC, XT M739 8-speed, XT V-brakes and Mavic Crossmax wheels.',
    story: `
      Every kid at my school wanted a Zaskar in 1995, and I finally got one 30 years later. It's a
      polished frame with the triple-triangle rear end, and it cost me $300 at a swap meet. It's
      threadless 1-1/8", so I used a Dia-Compe Aheadset with a Ritchey Force stem and a Ritchey Pro flat
      bar.

      The fork is a RockShox Judy XC with 63mm of travel, which is the most the frame is rated for. The
      Judy cartridge got rebuilt before it went on. The groupset is Deore XT M739, which is a couple of
      years newer than the frame. I wanted Rapidfire Plus shifting and V-brakes rather than period cantis,
      so the brakes are XT BR-M750 V-brakes with long-pull M739 levers, and they're night and day better.

      The wheels are Mavic Crossmax, which are late-'90s, but I'll take them over the original Ritchey
      wheels. They run an HG50 11-30 8-speed cassette and Panaracer Fire XC Pros. A Salsa Shaft post and a
      WTB SST saddle finish it, and the Bud Light bottle cage was mandatory.`,
    actualWeightG: 10900,
    parts: [
      slot('frame', 'gt-zaskar-1995'),
      slot('fork', 'rockshox-judy-xc-fork-1-1-8-threadless'),
      slot('headset', 'dia-compe-aheadset-1-1-8-threadless'),
      slot('wheels', 'mavic-crossmax-26-vbrake'),
      slot('tires', 'panaracer-fire-xc-pro-26x2-1'),
      slot('crankset', 'shimano-deore-xt-fc-m737-crankset'),
      slot('bottomBracket', 'shimano-deore-xt-bb-un72-73x113'),
      slot('chain', 'kmc-x8-chain'),
      slot('cassette', 'shimano-cs-hg50-8-cassette'),
      slot('frontDerailleur', 'shimano-deore-xt-fd-m739'),
      slot('rearDerailleur', 'shimano-deore-xt-rd-m739'),
      slot('shifters', 'shimano-deore-xt-sl-m739-rapidfire-plus'),
      slot('brakes', 'shimano-deore-xt-br-m750-v-brake'),
      slot('brakeLevers', 'shimano-deore-xt-bl-m739'),
      slot('handlebars', 'ritchey-pro-flat-bar-25-4'),
      slot('stem', 'ritchey-force-stem-1-1-8'),
      slot('seatpost', 'salsa-shaft-seatpost-27-0'),
      slot('saddle', 'wtb-sst'),
      slot('pedals', 'shimano-deore-xt-pd-m747'),
    ],
  }),

  entry({
    id: 'bridgestone-xo-1-1992',
    author: 'grant_was_right',
    publishedAt: '2026-09-05T09:05:00Z',
    likes: 119,
    comments: 33,
    name: '1992 Bridgestone XO-1 — Mustache & Bar-Cons',
    description: '1992 Bridgestone XO-1 in original orange-fade with a Nitto mustache bar, Suntour Bar-Cons, an XC Pro group and Shimano long-reach calipers.',
    story: `
      The XO-1 is the reason Rivendell exists, and in my opinion it's the best all-rounder anyone ever
      made. Mine is a '92 in the orange fade. I paid $1,150 for the frameset with the original fork, which
      is a lot, but they don't come up often.

      I kept the build close to Grant's original spec: a Nitto mustache bar on a Technomic stem, Suntour
      Bar-Con friction shifters, and a Suntour XC Pro crank and derailleurs over a New Winner 7-speed
      freewheel. The frame has 126mm rear spacing, so the wheels are Bullseye hubs laced to Araya 7X rims
      with a 126 rear.

      The original Dia-Compe brakes were tired, so the brakes are now Shimano BR-R650 long-reach calipers.
      The frame needs 49mm of reach, which is right in their range, and Dia-Compe DC165 aero levers sit on
      the mustache bar. Schwalbe Kojak 26x1.35 slicks make it fly on the road, and there's still room for
      fenders.

      A Brooks Professional sits on a Thomson setback post. People ask what it is at every coffee stop.`,
    actualWeightG: 11350,
    parts: [
      slot('frame', 'bridgestone-xo-1-1992'),
      slot('fork', 'bridgestone-xo-1-fork-1992'),
      slot('headset', 'tange-falcon-headset-1in'),
      slot('wheels', 'bullseye-araya-7x-freewheel-wheels-26'),
      slot('tires', 'schwalbe-kojak-26x1-35'),
      slot('crankset', 'suntour-xc-pro-crankset'),
      slot('bottomBracket', 'shimano-bb-un55-68x113'),
      slot('chain', 'sedis-sedisport-chain'),
      slot('cassette', 'suntour-new-winner-pro-7-freewheel'),
      slot('frontDerailleur', 'suntour-xc-pro-fd'),
      slot('rearDerailleur', 'suntour-xc-pro-rd'),
      slot('shifters', 'suntour-bar-con-shifters'),
      slot('brakes', 'shimano-br-r650-long-reach'),
      slot('brakeLevers', 'dia-compe-dc165'),
      slot('handlebars', 'nitto-mustache-bar'),
      slot('stem', 'nitto-technomic-stem'),
      slot('seatpost', 'thomson-elite-setback-27-0'),
      slot('saddle', 'brooks-professional'),
      slot('pedals', 'mks-sylvan-touring'),
    ],
  }),

]

export function getCommunityBuild(id: string): CommunityBuild | undefined {
  return COMMUNITY_BUILDS.find((b) => b.id === id)
}
