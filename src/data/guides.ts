import type { BuildGuide } from '@/types/build'

/** Curated Build Guides. Parts reference catalog ids — see src/data/parts/*.json. */
export const BUILD_GUIDES: BuildGuide[] = []

export function getGuide(id: string): BuildGuide | undefined {
  return BUILD_GUIDES.find((g) => g.id === id)
}
