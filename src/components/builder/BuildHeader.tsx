import { useRef, useState } from 'react'
import { useBuildStore } from '@/store/buildStore'
import { ALL_CATEGORIES } from '@/data/categoryConfig'
import { BuildProgress } from '@/components/ui/BuildProgress'
import { GroupBox, TextInput } from 'react95'
import styled from 'styled-components'

const MAX_BUILD_NAME_LENGTH = 80

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`

const ProgressRow = styled.div`
  margin-bottom: 4px;
  max-width: 320px;
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

export function BuildHeader() {
  const { build, setBuildName, getFilledCount } = useBuildStore()
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(build.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalCategories = ALL_CATEGORIES.length
  const filled = getFilledCount()
  const hasParts = filled > 0

  const commitName = () => {
    const trimmed = nameValue.trim().slice(0, MAX_BUILD_NAME_LENGTH)
    if (trimmed) setBuildName(trimmed)
    else setNameValue(build.name)
    setEditing(false)
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
            maxLength={MAX_BUILD_NAME_LENGTH}
            autoFocus
          />
        ) : (
          <BuildName onClick={() => { setEditing(true); setNameValue(build.name) }}>
            {build.name} ✏
          </BuildName>
        )}
      </NameRow>

      {hasParts && (
        <ProgressRow>
          <BuildProgress filled={filled} total={totalCategories} />
        </ProgressRow>
      )}
    </GroupBox>
  )
}
