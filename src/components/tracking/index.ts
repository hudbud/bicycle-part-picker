/**
 * Shared part-tracking widgets (builder, garage bike pages, parts bin).
 *
 * - `TrackingFields`     — controlled editor for a `PartTracking` ({ value, onChange, compact? })
 * - `ConditionBadge`     — New / NOS / Used – good / Used – fair / Needs work chip
 * - `PartTrackingDialog` — per-slot details dialog for a bike (status + tracking + Move to Parts Bin)
 * - `DistanceUnitToggle` — mi / km display unit
 * - `StageBadge`, service-kind / stage / condition labels
 */
export { TrackingFields, type TrackingFieldsProps } from './TrackingFields'
export { ConditionBadge } from './ConditionBadge'
export { PartTrackingDialog } from './PartTrackingDialog'
export { DistanceUnitToggle } from './DistanceUnitToggle'
export { StageBadge } from './StageBadge'
export { CONDITIONS, conditionLabel, conditionMeta, STATUS_OPTIONS, SOURCE_SUGGESTIONS } from './conditions'
export { SERVICE_KIND_LABELS, SERVICE_KINDS, STAGES, stageMeta } from './serviceKinds'
export { setSlotStatus, setSlotTracking, useBike } from './bikeEdits'
export { FieldInput, FieldSelect, FieldTextarea, FieldLabel, parseNum, todayISO } from './fields'
