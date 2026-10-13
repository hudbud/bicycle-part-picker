import type { CommunityBuild } from '@/types/build'

/** Seeded "Completed Builds" gallery. Parts reference catalog ids — see src/data/parts/*.json. */
export const COMMUNITY_BUILDS: CommunityBuild[] = []

export function getCommunityBuild(id: string): CommunityBuild | undefined {
  return COMMUNITY_BUILDS.find((b) => b.id === id)
}
