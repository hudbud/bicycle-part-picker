import type { Part, PartCategory } from '@/types/parts'

import framesData from './parts/frames.json'
import forksData from './parts/forks.json'
import wheelsData from './parts/wheels.json'
import tiresData from './parts/tires.json'
import cranksetData from './parts/cranksets.json'
import handblebarsData from './parts/handlebars.json'
import saddlesData from './parts/saddles.json'
import brakesData from './parts/brakes.json'
import stemsData from './parts/stems.json'
import seatpostsData from './parts/seatposts.json'
import cassettesData from './parts/cassettes.json'
import chainsData from './parts/chains.json'
import pedalsData from './parts/pedals.json'
import bottomBracketsData from './parts/bottomBrackets.json'

export const ALL_PARTS: Part[] = [
  ...framesData,
  ...forksData,
  ...wheelsData,
  ...tiresData,
  ...cranksetData,
  ...handblebarsData,
  ...saddlesData,
  ...brakesData,
  ...stemsData,
  ...seatpostsData,
  ...cassettesData,
  ...chainsData,
  ...pedalsData,
  ...bottomBracketsData,
] as Part[]

export const PARTS_BY_CATEGORY: Record<PartCategory, Part[]> = ALL_PARTS.reduce(
  (acc, part) => {
    if (!acc[part.category]) acc[part.category] = []
    acc[part.category].push(part)
    return acc
  },
  {} as Record<PartCategory, Part[]>,
)

export function getPartsByCategory(category: PartCategory): Part[] {
  return PARTS_BY_CATEGORY[category] ?? []
}

export function searchParts(query: string, category?: PartCategory): Part[] {
  const q = query.toLowerCase()
  const pool = category ? getPartsByCategory(category) : ALL_PARTS
  if (!q) return pool
  return pool.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  )
}
