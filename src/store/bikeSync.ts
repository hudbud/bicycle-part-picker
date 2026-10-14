import type { Build } from '@/types/build'
import { useBuildStore } from './buildStore'
import { useGarageStore } from './garageStore'

/** Which bike: the one open in the builder, or a saved garage bike. */
export type BikeRef = { kind: 'current' } | { kind: 'garage'; id: string }

export function getBike(ref: BikeRef): Build | undefined {
  return ref.kind === 'current' ? useBuildStore.getState().build : useGarageStore.getState().getBuildById(ref.id)
}

/**
 * Apply a tracking edit to a bike — and to its twin, so the builder's working copy and the
 * saved garage copy never disagree about what's on the bike, what was paid or the service
 * log. (Part *choices* in the builder stay a working copy until saved; tracking doesn't.)
 */
export function updateBike(ref: BikeRef, fn: (b: Build) => Build): void {
  const current = useBuildStore.getState().build
  const garage = useGarageStore.getState()
  const id = ref.kind === 'garage' ? ref.id : current.id
  if (ref.kind === 'current' || (id && current.id === id)) {
    useBuildStore.setState({ build: fn(current) })
  }
  const saved = id ? garage.getBuildById(id) : undefined
  if (saved) garage.updateBuild(fn(saved))
}
