import type { Part, PartCategory } from '@/types/parts'

import framesData from './parts/frames.json'
import forksData from './parts/forks.json'
import rearShocksData from './parts/rearShocks.json'
import headsetsData from './parts/headsets.json'
import wheelsData from './parts/wheels.json'
import tiresData from './parts/tires.json'
import hubsData from './parts/hubs.json'
import rimsData from './parts/rims.json'
import spokesData from './parts/spokes.json'
import cranksetData from './parts/cranksets.json'
import bottomBracketsData from './parts/bottomBrackets.json'
import chainsData from './parts/chains.json'
import cassettesData from './parts/cassettes.json'
import sprocketsData from './parts/sprockets.json'
import rearDerailleursData from './parts/rearDerailleurs.json'
import frontDerailleursData from './parts/frontDerailleurs.json'
import shiftersData from './parts/shifters.json'
import brakesData from './parts/brakes.json'
import rotorsData from './parts/rotors.json'
import handlebarsData from './parts/handlebars.json'
import stemsData from './parts/stems.json'
import seatpostsData from './parts/seatposts.json'
import saddlesData from './parts/saddles.json'
import pedalsData from './parts/pedals.json'
import brakeLeversData from './parts/brakeLevers.json'

// Alt / xbiking and vintage (1983–2004) catalog, kept in separate files per data set.
import framesAltData from './parts/frames.alt.json'
import forksAltData from './parts/forks.alt.json'
import headsetsAltData from './parts/headsets.alt.json'
import framesVintageData from './parts/frames.vintage.json'
import forksVintageData from './parts/forks.vintage.json'
import headsetsVintageData from './parts/headsets.vintage.json'
import cranksetsClassicData from './parts/cranksets.classic.json'
import bottomBracketsClassicData from './parts/bottomBrackets.classic.json'
import chainsClassicData from './parts/chains.classic.json'
import cassettesClassicData from './parts/cassettes.classic.json'
import sprocketsClassicData from './parts/sprockets.classic.json'
import rearDerailleursClassicData from './parts/rearDerailleurs.classic.json'
import frontDerailleursClassicData from './parts/frontDerailleurs.classic.json'
import shiftersClassicData from './parts/shifters.classic.json'
import wheelsClassicData from './parts/wheels.classic.json'
import tiresClassicData from './parts/tires.classic.json'
import hubsClassicData from './parts/hubs.classic.json'
import rimsClassicData from './parts/rims.classic.json'
import brakesClassicData from './parts/brakes.classic.json'
import handlebarsClassicData from './parts/handlebars.classic.json'
import stemsClassicData from './parts/stems.classic.json'
import seatpostsClassicData from './parts/seatposts.classic.json'
import saddlesClassicData from './parts/saddles.classic.json'
import pedalsClassicData from './parts/pedals.classic.json'

// Community-submitted frames, imported from GitHub issues by scripts/import-submission.mjs.
import framesCommunityData from './parts/frames.community.json'

export const ALL_PARTS: Part[] = [
  ...framesData,
  ...forksData,
  ...rearShocksData,
  ...headsetsData,
  ...wheelsData,
  ...tiresData,
  ...hubsData,
  ...rimsData,
  ...spokesData,
  ...cranksetData,
  ...bottomBracketsData,
  ...chainsData,
  ...cassettesData,
  ...sprocketsData,
  ...rearDerailleursData,
  ...frontDerailleursData,
  ...shiftersData,
  ...brakesData,
  ...rotorsData,
  ...handlebarsData,
  ...stemsData,
  ...seatpostsData,
  ...saddlesData,
  ...pedalsData,
  ...brakeLeversData,
  ...framesAltData,
  ...forksAltData,
  ...headsetsAltData,
  ...framesVintageData,
  ...forksVintageData,
  ...headsetsVintageData,
  ...cranksetsClassicData,
  ...bottomBracketsClassicData,
  ...chainsClassicData,
  ...cassettesClassicData,
  ...sprocketsClassicData,
  ...rearDerailleursClassicData,
  ...frontDerailleursClassicData,
  ...shiftersClassicData,
  ...wheelsClassicData,
  ...tiresClassicData,
  ...hubsClassicData,
  ...rimsClassicData,
  ...brakesClassicData,
  ...handlebarsClassicData,
  ...stemsClassicData,
  ...seatpostsClassicData,
  ...saddlesClassicData,
  ...pedalsClassicData,
  ...framesCommunityData,
] as Part[]

export const PARTS_BY_CATEGORY: Record<string, Part[]> = ALL_PARTS.reduce(
  (acc, part) => {
    if (!acc[part.category]) acc[part.category] = []
    acc[part.category].push(part)
    return acc
  },
  {} as Record<string, Part[]>,
)

const PARTS_BY_ID = new Map(ALL_PARTS.map((p) => [p.id, p]))

// frontWheel and rearWheel draw from the same pool as wheels
const CATEGORY_ALIASES: Partial<Record<PartCategory, PartCategory>> = {
  frontWheel: 'wheels',
  rearWheel: 'wheels',
}

export function resolveCategory(category: PartCategory): PartCategory {
  return CATEGORY_ALIASES[category] ?? category
}

export function getPartsByCategory(category: PartCategory): Part[] {
  return PARTS_BY_CATEGORY[resolveCategory(category)] ?? []
}

export function getPartById(id: string): Part | undefined {
  return PARTS_BY_ID.get(id)
}

/**
 * The live catalog version of a part. Builds store a snapshot of each part; older
 * snapshots lack `attrs`/`weightG`, so compatibility and pricing look the part up by id.
 * Custom parts (and unknown ids) are returned as-is.
 */
export function resolvePart(part: Part): Part {
  if (part.isCustom) return part
  return PARTS_BY_ID.get(part.id) ?? part
}

export function getBrands(category: PartCategory): string[] {
  return [...new Set(getPartsByCategory(category).map((p) => p.brand))].sort((a, b) => a.localeCompare(b))
}

export function searchParts(query: string, category?: PartCategory): Part[] {
  const q = query.toLowerCase()
  const pool = category ? getPartsByCategory(category) : ALL_PARTS
  if (!q) return pool
  return pool.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      `${p.brand} ${p.name}`.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  )
}
