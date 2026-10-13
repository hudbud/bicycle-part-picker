export type PartCategory =
  | 'frame'
  | 'fork'
  | 'rearShock'
  | 'headset'
  | 'wheels'
  | 'frontWheel'
  | 'rearWheel'
  | 'hub'
  | 'rim'
  | 'spokes'
  | 'tires'
  | 'crankset'
  | 'bottomBracket'
  | 'chain'
  | 'cassette'
  | 'sprocket'
  | 'rearDerailleur'
  | 'frontDerailleur'
  | 'shifters'
  | 'brakes'
  | 'rotors'
  | 'handlebars'
  | 'stem'
  | 'seatpost'
  | 'saddle'
  | 'pedals'
  | 'dropperPost'

export type Material = 'carbon' | 'aluminum' | 'steel' | 'titanium'

export type Discipline = 'road' | 'gravel' | 'mtb' | 'track' | 'bmx' | 'urban'

/**
 * Wheel size as ISO bead seat diameter (mm) — the only unambiguous way to say it.
 * 622 = 700c / 29", 584 = 650b / 27.5", 559 = 26", 507 = 24", 406 = 20" BMX.
 */
export type WheelSize = 622 | 584 | 559 | 507 | 406

export type BottomBracketShell =
  | 'BSA 68/73mm'
  | 'T47'
  | 'BB86/BB92'
  | 'PF30'
  | 'BB30'
  | 'BB386EVO'
  | 'Italian'
  | 'BMX Mid'
  | 'BMX Spanish'

export type BottomBracketSpindle =
  | '24mm'
  | 'DUB 28.99mm'
  | '30mm'
  | 'GXP'
  | 'Square Taper'
  | 'Campagnolo Ultra-Torque'
  | '19mm BMX'
  | '22mm BMX'

export type Steerer = 'Tapered 1-1/8" to 1.5"' | 'Straight 1-1/8"' | 'Straight 1"'

export type HeadsetStandard =
  | 'ZS44/ZS56'
  | 'IS42/IS52'
  | 'ZS44/EC44'
  | 'EC34/EC34'
  | 'IS41/IS52'
  | 'Integrated 45x45'
  | 'Proprietary'

export type FrontAxle = '12x100mm' | '15x110mm Boost' | '15x100mm' | '20x110mm' | 'QR 100mm' | '100mm Nutted' | '3/8" BMX'

export type RearAxle =
  | '12x142mm'
  | '12x148mm Boost'
  | '12x157mm SuperBoost'
  | 'QR 135mm'
  | 'QR 130mm'
  | '120mm Track'
  | '110mm BMX'

/** Brake caliper mounting standard on a frame/fork, and the mount a caliper needs. */
export type BrakeMount = 'Flat Mount' | 'Post Mount' | 'Rim Caliper' | 'V-Brake/Cantilever' | 'U-Brake' | 'None'

export type BrakeType = 'Hydraulic Disc' | 'Mechanical Disc' | 'Rim Caliper' | 'V-Brake' | 'U-Brake'

/** How a hub accepts a rotor. 'Rim Brake' = no disc interface at all. */
export type RotorInterface = 'Center Lock' | '6-Bolt' | 'Rim Brake'

export type Freehub =
  | 'Shimano HG 11/12s Road'
  | 'Shimano HG 8-10s / MTB'
  | 'Shimano Microspline'
  | 'SRAM XD'
  | 'SRAM XDR'
  | 'Campagnolo N3W'
  | 'Track Fixed'
  | 'BMX Cassette Driver'

/**
 * Shifter ↔ derailleur cable-pull / protocol family. A shifter and rear derailleur
 * must share a system to work together.
 */
export type ShiftSystem =
  | 'Shimano Road 11s'
  | 'Shimano Road 12s'
  | 'Shimano Di2 12s'
  | 'Shimano MTB 12s'
  | 'Shimano GRX 11s'
  | 'Shimano Linkglide 10/11s'
  | 'SRAM AXS'
  | 'SRAM Eagle 12s Mech'
  | 'SRAM Road 11s Mech'
  | 'Campagnolo 12s'
  | 'Campagnolo Ekar 13s'
  | 'Single Speed'

export type HandlebarType = 'Drop' | 'Flat' | 'Riser' | 'BMX' | 'Bullhorn' | 'Integrated Drop'

export type PedalSystem = 'Shimano SPD' | 'Shimano SPD-SL' | 'Look Keo' | 'Crankbrothers' | 'Time' | 'Speedplay' | 'Flat'

export type Suspension = 'Rigid' | 'Hardtail' | 'Full Suspension'

/**
 * Structured, typed part attributes. These drive the compatibility checker,
 * the browse-page filters/columns and the product spec table. Every key is optional;
 * which ones are meaningful depends on the category (see `src/data/specSchema.ts`).
 */
export interface PartAttrs {
  material?: Material
  disciplines?: Discipline[]
  color?: string

  // Wheel / tire fit
  wheelSizes?: WheelSize[]      // frame, fork: accepted sizes
  wheelSize?: WheelSize         // wheels, tires, rims, front/rear wheel
  maxTireMm?: number            // frame, fork: max tire clearance (width, mm)
  tireWidthMm?: number          // tires
  tubeless?: boolean            // wheels, rims, tires: tubeless ready
  rimInternalMm?: number        // wheels, rims
  rimDepthMm?: number           // wheels, rims

  // Axles & brakes
  frontAxle?: FrontAxle         // fork, wheels, hubs
  rearAxle?: RearAxle           // frame, wheels, hubs
  brakeMount?: BrakeMount       // frame (rear), fork (front), brakes (required mount)
  brakeType?: BrakeType         // brakes; shifters: which brake their levers actuate
  rotorInterface?: RotorInterface // wheels, hubs, rotors
  rotorSizeMm?: number          // rotors
  maxRotorMm?: number           // frame/fork: largest supported rotor

  // Steering
  steerer?: Steerer             // fork (what it has), frame/headset (what it accepts)
  headsetStd?: HeadsetStandard  // frame, headset

  // Suspension
  suspension?: Suspension       // frame
  travelMm?: number             // fork, frame (rear travel), dropper
  maxForkTravelMm?: number      // frame: max recommended fork travel
  shockSize?: string            // frame, rear shock — eye-to-eye x stroke, e.g. "210x55"
  shockMount?: 'Trunnion' | 'Standard' // frame, rear shock
  springType?: 'Air' | 'Coil'   // fork, rear shock

  // Drivetrain
  bbShell?: BottomBracketShell  // frame, bottom bracket
  bbSpindle?: BottomBracketSpindle // crankset, bottom bracket
  speeds?: number               // cassette, chain, derailleurs, shifters, crankset (1 = single speed)
  freehub?: Freehub             // wheels, hubs, cassette, sprocket
  shiftSystem?: ShiftSystem     // shifters, rear derailleur
  electronic?: boolean          // shifters, derailleurs
  chainrings?: string           // crankset, e.g. "52/36" or "32"
  chainringCount?: 1 | 2 | 3    // crankset
  crankLengthMm?: number        // crankset (default length)
  cassetteRange?: string        // cassette, e.g. "10-51T"
  smallestCogT?: number         // cassette, sprocket (teeth)
  largestCogT?: number          // cassette
  maxCogT?: number              // rear derailleur: largest supported cog
  udh?: boolean                 // frame: has SRAM Universal Derailleur Hanger
  udhRequired?: boolean         // rear derailleur: direct-mount to UDH only (SRAM Transmission)
  derailleurHanger?: boolean    // frame: has any derailleur hanger (false = single-speed / track)
  frontDerailleurMount?: 'Braze-on' | 'Clamp' | 'Direct Mount' | 'None' // frame, front derailleur
  flattop?: boolean             // chain: SRAM Flattop

  // Cockpit
  handlebarType?: HandlebarType // handlebars; shifters: bar type they fit
  barClampMm?: number           // handlebars, stem (25.4, 31.8, 35, 22.2)
  barWidthMm?: number           // handlebars
  stemLengthMm?: number         // stem
  stemAngleDeg?: number         // stem
  seatpostMm?: number           // frame (seat tube ID), seatpost (diameter)
  dropper?: boolean             // seatpost
  setbackMm?: number            // seatpost
  saddleWidthMm?: number        // saddle
  railMaterial?: string         // saddle

  pedalSystem?: PedalSystem     // pedals
}

/** Legacy free-form display specs. New data should prefer `attrs`. */
export interface PartSpec {
  [key: string]: string | number | undefined
}

export interface Part {
  id: string
  name: string
  brand: string
  category: PartCategory
  /** Manufacturer list price (MSRP) in USD. Retailer prices derive from this. */
  price?: number
  /**
   * Claimed weight in grams for one unit as priced: per tire and per rotor (builds use
   * quantity 2), per pair for brakes/pedals/wheelsets, per frame (no fork) for frames.
   */
  weightG?: number
  /** Model year / release year, used for "newest" sorting. */
  year?: number
  attrs?: PartAttrs
  specs: PartSpec
  tags: string[]
  url?: string
  isCustom?: boolean
}
