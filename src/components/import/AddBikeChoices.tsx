import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Button, Frame } from 'react95'

const Box = styled(Frame).attrs({ variant: 'field' })`
  width: 100%;
  background: var(--win-window);
  color: var(--win-window-text);
  padding: 10px 12px;
`

const Choice = styled.div`
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  align-items: center;
  gap: 4px 12px;
  padding: 6px 0;
  font-size: 12px;
  line-height: 1.4;
  & + & { border-top: 1px solid var(--win-light); }
  button { width: 100%; justify-content: flex-start; padding: 0 10px; }
  @media (max-width: 639px) {
    grid-template-columns: 1fr;
  }
`

const A = styled(Link)`
  color: var(--win-link);
`

/** The three ways to get a bike into the Garage. Used by the empty Garage and its "+ Add Bike" button. */
export function AddBikeChoices({ heading, onStartFromFrame }: { heading?: string; onStartFromFrame: () => void }) {
  const navigate = useNavigate()
  return (
    <Box>
      {heading && <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>{heading}</p>}
      <Choice>
        <Button primary onClick={() => navigate('/garage/import')} style={{ fontWeight: 700 }}>Paste a parts list…</Button>
        <span>
          Already have the bike? Paste its list from a Reddit post, forum thread, spreadsheet or your notes and
          we&rsquo;ll match each line to the catalog.
        </span>
      </Choice>
      <Choice>
        <Button onClick={onStartFromFrame}>Start from a frame</Button>
        <span>Pick the parts one at a time in the Builder, with compatibility checks, then save it here.</span>
      </Choice>
      <Choice>
        <Button onClick={() => navigate('/guides')}>Copy a guide…</Button>
        <span>
          Start from a build guide or a <A to="/builds">community build</A> that&rsquo;s close to yours, then swap
          what&rsquo;s different.
        </span>
      </Choice>
    </Box>
  )
}
