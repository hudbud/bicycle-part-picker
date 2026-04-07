import { useState, useRef } from 'react'
import type { BikeType } from '@/types/build'
import { useBuildStore } from '@/store/buildStore'
import { BuildProgress } from '@/components/ui/BuildProgress'
import { getCategoriesForBikeType } from '@/data/categoryConfig'

const BIKE_TYPES: { value: BikeType; label: string }[] = [
  { value: 'road', label: 'Road' },
  { value: 'mtb', label: 'Mountain' },
  { value: 'gravel', label: 'Gravel' },
  { value: 'track', label: 'Track' },
  { value: 'bmx', label: 'BMX' },
  { value: 'other', label: 'Other' },
]

export function BuildHeader() {
  const { build, setBuildName, setBikeType, getFilledCount } = useBuildStore()
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(build.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalCategories = getCategoriesForBikeType(build.bikeType).length
  const filled = getFilledCount()

  const commitName = () => {
    const trimmed = nameValue.trim()
    if (trimmed) setBuildName(trimmed)
    else setNameValue(build.name)
    setEditing(false)
  }

  return (
    <div className="space-y-3 pb-4 border-b border-border-default">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {editing ? (
          <input
            ref={inputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') {
                setNameValue(build.name)
                setEditing(false)
              }
            }}
            className="text-2xl font-medium bg-transparent border-b-2 border-accent outline-none text-text-primary min-w-0 flex-1"
            autoFocus
          />
        ) : (
          <button
            onClick={() => { setEditing(true); setNameValue(build.name) }}
            className="text-2xl font-medium text-text-primary hover:text-accent transition-colors text-left group flex items-center gap-2"
          >
            {build.name}
            <svg className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {BIKE_TYPES.map((bt) => (
          <button
            key={bt.value}
            onClick={() => setBikeType(bt.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              build.bikeType === bt.value
                ? 'bg-accent text-white'
                : 'bg-bg-subtle text-text-secondary border border-border-default hover:border-accent hover:text-text-primary'
            }`}
          >
            {bt.label}
          </button>
        ))}
      </div>

      <BuildProgress filled={filled} total={totalCategories} />
    </div>
  )
}
