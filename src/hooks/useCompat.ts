import { useMemo } from 'react'
import { useBuildStore } from '@/store/buildStore'
import { checkBuild, estimateWeight, type CompatIssue, type WeightEstimate } from '@/compat/engine'
import type { Build } from '@/types/build'
import type { PartCategory } from '@/types/parts'

export interface BuildCompat {
  issues: CompatIssue[]
  errors: CompatIssue[]
  warnings: CompatIssue[]
  notes: CompatIssue[]
  weight: WeightEstimate
  /** Issues involving one builder row. */
  issuesFor: (category: PartCategory) => CompatIssue[]
}

export function computeCompat(build: Build): BuildCompat {
  const issues = checkBuild(build)
  return {
    issues,
    errors: issues.filter((i) => i.severity === 'error'),
    warnings: issues.filter((i) => i.severity === 'warning'),
    notes: issues.filter((i) => i.severity === 'note'),
    weight: estimateWeight(build),
    issuesFor: (category) => issues.filter((i) => i.categories.includes(category)),
  }
}

/** Compatibility + weight for the current build (or any build passed in). */
export function useCompat(buildOverride?: Build): BuildCompat {
  const current = useBuildStore((s) => s.build)
  const build = buildOverride ?? current
  return useMemo(() => computeCompat(build), [build])
}
