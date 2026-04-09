export type PartCategory =
  | 'frame'
  | 'fork'
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
  | 'handlebars'
  | 'stem'
  | 'saddle'
  | 'seatpost'
  | 'pedals'
  | 'brakes'
  | 'rearShock'
  | 'dropperPost'
  | 'sprocket'

export type Material = 'carbon' | 'aluminum' | 'steel' | 'titanium'

export interface PartSpec {
  material?: Material
  weight?: string
  axle?: string
  brakeMount?: string
  brakeType?: string
  rimDepth?: string
  rimWidth?: string
  travel?: string
  speeds?: number
  chainrings?: string
  spindle?: string
  bcd?: string
  clampDiameter?: string
  width?: string
  drop?: string
  reach?: string
  size?: string
  type?: string
  compound?: string
  mount?: string
  rotor?: string
  pistons?: string
  freehub?: string
  damper?: string
  engagement?: string
  rise?: string
  actuation?: string
  [key: string]: string | number | undefined
}

export interface Part {
  id: string
  name: string
  brand: string
  category: PartCategory
  price?: number
  specs: PartSpec
  tags: string[]
  url?: string
  isCustom?: boolean
}
