// The site used to live on Vercel, then briefly on workers.dev. Browsers keep each address's
// storage separately, so an old address's "moved" page (moved/index.html) hands its saved data
// to /move-in here through postMessage. This adds it the way Restore backup does: nothing here
// is overwritten.

import type { Build } from '@/types/build'
import type { Part } from '@/types/parts'
import { useGarageStore } from '@/store/garageStore'
import { useBuildStore } from '@/store/buildStore'
import { usePartsBinStore, type BinItem } from '@/store/partsBinStore'
import { useCustomPartsStore } from '@/store/customPartsStore'
import { useSettingsStore } from '@/store/settingsStore'
import { migrateLegacyPhotos } from '@/utils/bikePhotos'

export const OLD_ORIGINS = [
  'https://bicycle-part-picker.vercel.app',
  'https://bicycle-part-picker-hudbud.vercel.app',
  'https://bicycle-part-picker-git-main-hudbud.vercel.app',
  'https://bicycle-part-picker.hudbud.workers.dev',
]

const isLocal = (host: string) => host === 'localhost' || host === '127.0.0.1'

/** Whether a message really comes from the old site (or, in local tests, another local port). */
export function isOldSite(origin: string): boolean {
  if (OLD_ORIGINS.includes(origin)) return true
  try {
    return isLocal(window.location.hostname) && isLocal(new URL(origin).hostname) && origin !== window.location.origin
  } catch {
    return false
  }
}

/** Raw localStorage values from the old site, by key. */
export type OldSiteData = Record<string, string>

const state = (data: OldSiteData, key: string): Record<string, unknown> | undefined => {
  try {
    const s = JSON.parse(data[key] ?? 'null')?.state
    return s && typeof s === 'object' ? s : undefined
  } catch {
    return undefined
  }
}
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : [])
const hasContent = (b: Build) => b.components?.some((c) => c.part) || !!b.additionalItems?.length

export async function importFromOldSite(data: OldSiteData): Promise<{ bikes: number; parts: number }> {
  const garage = list<Build>(state(data, 'ppp-garage')?.builds)
  let bikes = useGarageStore.getState().importBuilds(garage)

  // The build that was open there: open it here too if nothing is, otherwise park it in the garage.
  const bench = state(data, 'ppp-current-build')?.build as Build | undefined
  if (bench && Array.isArray(bench.components) && hasContent(bench)) {
    if (!hasContent(useBuildStore.getState().build)) {
      useBuildStore.getState().loadBuild(bench)
      bikes++
    } else bikes += useGarageStore.getState().importBuilds([{ ...bench, id: undefined, name: `${bench.name || 'My Build'} (from the old site)` }])
  }

  let parts = usePartsBinStore.getState().importItems(list<BinItem>(state(data, 'ppp-parts-bin')?.items))
  const custom = useCustomPartsStore.getState()
  for (const p of list<Part>(state(data, 'ppp-custom-parts')?.parts)) {
    if (!custom.parts.some((c) => c.id === p.id)) parts++
    custom.addPart(p)
  }

  // Settings only if this address has none of its own yet.
  const settings = state(data, 'ppp-settings')
  if (settings && !localStorage.getItem('ppp-settings')) useSettingsStore.setState(settings)

  // Old bikes kept their photo inline; move those into this browser's photo store.
  await migrateLegacyPhotos()
  return { bikes, parts }
}
