import type { BuildStage, ServiceKind } from '@/types/build'

export const SERVICE_KIND_LABELS: Record<ServiceKind, string> = {
  replaced: 'Replaced',
  serviced: 'Serviced',
  adjusted: 'Adjusted',
  cleaned: 'Cleaned',
  inspected: 'Inspected',
  repaired: 'Repaired',
  other: 'Other',
}

export const SERVICE_KINDS = Object.keys(SERVICE_KIND_LABELS) as ServiceKind[]

export const STAGES: { value: BuildStage; label: string; color: string }[] = [
  { value: 'planning', label: 'Planning', color: '#606060' },
  { value: 'building', label: 'Building', color: '#806000' },
  { value: 'riding', label: 'Riding', color: '#006000' },
  { value: 'retired', label: 'Retired', color: '#404040' },
]

export function stageMeta(stage: BuildStage | undefined) {
  return STAGES.find((s) => s.value === stage)
}
