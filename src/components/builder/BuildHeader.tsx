import { useMemo, useState } from 'react'
import { useBuildStore } from '@/store/buildStore'
import { useCompat } from '@/hooks/useCompat'
import { useToast } from '@/hooks/useToast'
import { ALL_CATEGORIES } from '@/data/categoryConfig'
import { BuildProgress } from '@/components/ui/BuildProgress'
import { CompatBanner } from '@/components/build/CompatBanner'
import { buildShareUrl } from '@/utils/buildCodec'
import { useGarageStore } from '@/store/garageStore'
import { RouterAnchor } from '@/components/build/BuildCells'
import { StageBadge } from '@/components/tracking/StageBadge'
import { FieldSelect } from '@/components/tracking/fields'
import { BUILD_TEMPLATES, hiddenCategories, matchTemplate } from '@/data/buildTemplates'
import { Button, TextInput } from 'react95'
import styled from 'styled-components'

const MAX_BUILD_NAME_LENGTH = 80

const NameRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 6px;
`

const BuildName = styled.button`
  font-size: 18px;
  font-weight: 700;
  font-family: ms_sans_serif, sans-serif;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  text-align: left;
  &:hover { text-decoration: underline; }
`

const PermalinkRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 8px;
  font-size: 12px;
`

export function BuildHeader() {
  const build = useBuildStore((s) => s.build)
  const setBuildName = useBuildStore((s) => s.setBuildName)
  const setHiddenRows = useBuildStore((s) => s.setHiddenRows)
  const compat = useCompat()
  const { success } = useToast()
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(build.name)
  const savedInGarage = useGarageStore((s) => !!build.id && s.builds.some((b) => b.id === build.id))

  const filled = build.components.filter((s) => s.part).length
  const hasParts = filled > 0
  const template = matchTemplate(build)
  const permalink = useMemo(() => (hasParts ? buildShareUrl(build) : ''), [build, hasParts])

  const commitName = () => {
    const trimmed = nameValue.trim().slice(0, MAX_BUILD_NAME_LENGTH)
    if (trimmed) setBuildName(trimmed)
    else setNameValue(build.name)
    setEditing(false)
  }

  const copyPermalink = async () => {
    try {
      await navigator.clipboard.writeText(permalink)
      success(build.photos?.length ? 'Permalink copied! (photos not included)' : 'Permalink copied!')
    } catch {
      /* clipboard blocked — the field is selectable */
    }
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <NameRow>
        {editing ? (
          <TextInput
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') { setNameValue(build.name); setEditing(false) }
            }}
            maxLength={MAX_BUILD_NAME_LENGTH}
            autoFocus
            style={{ minWidth: 260 }}
          />
        ) : (
          <BuildName onClick={() => { setEditing(true); setNameValue(build.name) }} title="Rename build">
            {build.name} ✏
          </BuildName>
        )}
        {savedInGarage && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <StageBadge stage={build.stage} />
            <RouterAnchor to={`/garage/${build.id}`} title="Odometer, per-part tracking and service log">Bike page &amp; service log →</RouterAnchor>
          </span>
        )}
        <span style={{ flex: 1 }} />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }} title="Hides empty rows a setup usually doesn't use. Any row can be added back, and rows with a part always show.">
          Template
          <FieldSelect
            value={template}
            onChange={(e) => setHiddenRows(BUILD_TEMPLATES.find((t) => t.id === e.target.value)?.hide ?? [])}
          >
            <option value="">None (every row)</option>
            {BUILD_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            {template === 'custom' && <option value="custom" disabled>Custom rows</option>}
          </FieldSelect>
        </label>
        {hasParts && (
          <div style={{ flex: '0 1 300px', minWidth: 200 }}>
            <BuildProgress filled={filled} total={ALL_CATEGORIES.length - hiddenCategories(build).length} />
          </div>
        )}
      </NameRow>

      <CompatBanner build={build} compat={compat} />

      {hasParts && (
        <PermalinkRow>
          <label htmlFor="build-permalink" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Permalink:</label>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TextInput
              id="build-permalink"
              value={permalink}
              readOnly
              fullWidth
              onFocus={(e) => (e.target as HTMLInputElement).select()}
              style={{ fontSize: 12 }}
            />
          </div>
          <Button size="sm" onClick={copyPermalink} style={{ fontSize: 12 }}>Copy</Button>
        </PermalinkRow>
      )}
    </div>
  )
}
