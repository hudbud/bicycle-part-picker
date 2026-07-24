import type { Build } from '@/types/build'
import type { BinItem } from '@/store/partsBinStore'
import { isBuild } from './buildCodec'

export interface GarageBackup {
  version: 1
  exportedAt: string
  builds: Build[]
  partsBin: BinItem[]
}

function isBinItem(x: unknown): x is BinItem {
  if (typeof x !== 'object' || x === null) return false
  const item = x as Record<string, unknown>
  return typeof item.id === 'string' && typeof item.status === 'string' && typeof item.part === 'object'
}

export function buildGarageBackup(builds: Build[], partsBin: BinItem[]): string {
  const backup: GarageBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    builds,
    partsBin,
  }
  return JSON.stringify(backup, null, 2)
}

export function parseGarageBackup(text: string): GarageBackup | null {
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null) return null
    const b = parsed as Record<string, unknown>
    if (!Array.isArray(b.builds) || !Array.isArray(b.partsBin)) return null
    if (!b.builds.every(isBuild) || !b.partsBin.every(isBinItem)) return null
    return b as unknown as GarageBackup
  } catch {
    return null
  }
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '-').trim() || 'build'
}
