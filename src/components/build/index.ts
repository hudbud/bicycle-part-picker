/**
 * Reusable, read-only build display components. Everything here takes a `Build`
 * (any build — current, shared, guide, community) and computes prices, retailers,
 * weights and compatibility live from the catalog.
 *
 * - `BuildPartList`  — the full read-only part list (banner + table + totals + issues)
 * - `CompatBanner`   — green/yellow/red compatibility bar with estimated weight
 * - `BuildIssues`    — "Potential Issues" and "Notes" boxes
 * - `BuildTotals`    — Parts / Extras / Total summary
 * - `generateMarkup` — PCPartPicker-style Reddit / BBCode / text price table
 * - `generatePost` / `suggestTitle` — xbiking-style grouped parts list + post title
 */
export { BuildPartList, type BuildPartListProps } from './BuildPartList'
export { CompatBanner } from './CompatBanner'
export { BuildIssues } from './BuildIssues'
export { BuildTotals } from './BuildTotals'
export { CompatLevelIcon, RowCompatIcon, SelectionLabel, BuyButton, RouterAnchor } from './BuildCells'
export {
  generateMarkup, compatSummary, MARKUP_FORMATS, type MarkupFormat, type MarkupOptions,
  suggestTitle, generatePost, redditMarkdown, plainTextPost, bbcodePost, escapeMarkdown,
  POST_FORMATS, DEFAULT_POST_OPTIONS, type PostFormat, type PostOptions,
} from './buildMarkup'
export {
  getSlotRows, getSlotRow, slotLabel, partTitle, choosePath, compatLevel, weightLabel, weightTooltip,
  COMPAT_MESSAGES, type SlotRow, type CompatLevel,
} from './buildRows'
