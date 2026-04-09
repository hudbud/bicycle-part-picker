import { useRef, useState } from 'react'
import type { BikeType } from '@/types/build'
import { useBuildStore } from '@/store/buildStore'
import { getCategoriesForBikeType } from '@/data/categoryConfig'
import { Button, GroupBox, TextInput } from 'react95'
import styled from 'styled-components'

const BIKE_TYPES: { value: BikeType; label: string }[] = [
  { value: 'road',   label: 'Road' },
  { value: 'mtb',    label: 'Mountain' },
  { value: 'gravel', label: 'Gravel' },
  { value: 'track',  label: 'Track' },
  { value: 'bmx',    label: 'BMX' },
  { value: 'other',  label: 'Other' },
]

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`

const BikeTypeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
`

const BuildName = styled.button`
  font-size: 18px;
  font-weight: 700;
  font-family: ms_sans_serif, sans-serif;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  &:hover { text-decoration: underline; }
`

const BikeTypeChip = styled.button`
  font-size: 11px;
  font-family: ms_sans_serif, sans-serif;
  background: none;
  border: 1px solid #888;
  cursor: pointer;
  padding: 1px 6px;
  opacity: 0.7;
  &:hover { opacity: 1; text-decoration: underline; }
`

export function BuildHeader() {
  const { build, setBuildName, setBikeType, getFilledCount } = useBuildStore()
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(build.name)
  const [typePickerOpen, setTypePickerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalCategories = getCategoriesForBikeType(build.bikeType).length
  const filled = getFilledCount()
  const hasParts = filled > 0

  const currentLabel = BIKE_TYPES.find((b) => b.value === build.bikeType)?.label ?? build.bikeType

  const commitName = () => {
    const trimmed = nameValue.trim()
    if (trimmed) setBuildName(trimmed)
    else setNameValue(build.name)
    setEditing(false)
  }

  const handleTypeSelect = (type: BikeType) => {
    setBikeType(type)
    setTypePickerOpen(false)
  }

  return (
    <GroupBox label="Build" style={{ marginBottom: 8 }}>
      <NameRow>
        {editing ? (
          <TextInput
            ref={inputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') { setNameValue(build.name); setEditing(false) }
            }}
            autoFocus
          />
        ) : (
          <BuildName onClick={() => { setEditing(true); setNameValue(build.name) }}>
            {build.name} ✏
          </BuildName>
        )}
        {hasParts && !typePickerOpen && (
          <BikeTypeChip onClick={() => setTypePickerOpen(true)} title="Change bike type">
            {currentLabel} ▾
          </BikeTypeChip>
        )}
        {hasParts && !typePickerOpen && (
          <span style={{ fontSize: 11, opacity: 0.5 }}>
            {filled} of {totalCategories}
          </span>
        )}
      </NameRow>

      {(!hasParts || typePickerOpen) && (
        <BikeTypeRow>
          {BIKE_TYPES.map((bt) => (
            <Button
              key={bt.value}
              variant={build.bikeType === bt.value ? 'raised' : 'flat'}
              onClick={() => handleTypeSelect(bt.value)}
              style={{ fontSize: 11 }}
            >
              {bt.label}
            </Button>
          ))}
          {typePickerOpen && (
            <Button variant="flat" style={{ fontSize: 11, opacity: 0.6 }} onClick={() => setTypePickerOpen(false)}>
              Cancel
            </Button>
          )}
        </BikeTypeRow>
      )}
    </GroupBox>
  )
}
