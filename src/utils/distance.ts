import type { DistanceUnit } from '@/store/settingsStore'

const KM_PER_MI = 1.609344

/** Stored km → display number in `unit`. */
export function fromKm(km: number, unit: DistanceUnit): number {
  return unit === 'km' ? km : km / KM_PER_MI
}

/** Entered number in `unit` → stored km. */
export function toKm(value: number, unit: DistanceUnit): number {
  return unit === 'km' ? value : value * KM_PER_MI
}

/** "1,240 mi" */
export function formatDistance(km: number | undefined, unit: DistanceUnit): string {
  if (km == null) return '—'
  return `${Math.round(fromKm(km, unit)).toLocaleString()} ${unit}`
}
