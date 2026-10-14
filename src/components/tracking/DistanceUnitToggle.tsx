import { Button } from 'react95'
import { useSettingsStore, type DistanceUnit } from '@/store/settingsStore'

const UNITS: DistanceUnit[] = ['mi', 'km']

/** "[mi][km]" segmented toggle for the display distance unit (stored values stay km). */
export function DistanceUnitToggle({ label = 'Units:' }: { label?: string }) {
  const unit = useSettingsStore((s) => s.distanceUnit)
  const setUnit = useSettingsStore((s) => s.setDistanceUnit)
  return (
    <span role="group" aria-label="Distance unit" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
      {label && <span>{label}</span>}
      {UNITS.map((u) => (
        <Button
          key={u}
          size="sm"
          active={unit === u}
          aria-pressed={unit === u}
          onClick={() => setUnit(u)}
          style={{ minWidth: 34, height: 22, fontSize: 12, fontWeight: unit === u ? 700 : 400 }}
        >
          {u}
        </Button>
      ))}
    </span>
  )
}
