import { GroupBox } from 'react95'
import styled from 'styled-components'
import type { CompatIssue } from '@/compat/engine'
import type { BuildCompat } from '@/hooks/useCompat'
import { CompatIcon } from '@/components/ui/CompatIcon'
import { slotLabel } from './buildRows'

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Item = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 1.4;
`

const Affected = styled.span`
  display: block;
  font-size: 11px;
  color: var(--win-muted);
`

function IssueItem({ issue }: { issue: CompatIssue }) {
  return (
    <Item>
      <span style={{ paddingTop: 1 }}><CompatIcon severity={issue.severity} /></span>
      <span>
        {issue.message}
        {issue.categories.length > 0 && (
          <Affected>Affects: {issue.categories.map(slotLabel).join(', ')}</Affected>
        )}
      </span>
    </Item>
  )
}

/**
 * PCPartPicker's "Potential Issues" (errors + warnings) and "Notes" boxes.
 * Renders nothing when there's nothing to say.
 */
export function BuildIssues({ compat }: { compat: BuildCompat }) {
  const problems = [...compat.errors, ...compat.warnings]
  if (problems.length === 0 && compat.notes.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {problems.length > 0 && (
        <GroupBox label={`Potential Issues (${problems.length})`}>
          <List>{problems.map((i) => <IssueItem key={i.id} issue={i} />)}</List>
        </GroupBox>
      )}
      {compat.notes.length > 0 && (
        <GroupBox label={`Notes (${compat.notes.length})`}>
          <List>{compat.notes.map((i) => <IssueItem key={i.id} issue={i} />)}</List>
        </GroupBox>
      )}
    </div>
  )
}
