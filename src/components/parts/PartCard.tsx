import type { Part } from '@/types/parts'
import styled from 'styled-components'

const CardItem = styled.button`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  &:hover {
    background: navy;
    color: white;
  }
`

interface PartCardProps {
  part: Part
  selected?: boolean
  onSelect: (part: Part) => void
}

export function PartCard({ part, selected, onSelect }: PartCardProps) {
  return (
    <CardItem onClick={() => onSelect(part)} style={{ fontWeight: selected ? 700 : 400 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: selected ? 700 : 400 }}>{part.name}</span>
          {selected && <span style={{ fontSize: 12 }}>✓</span>}
        </div>
        <p style={{ fontSize: 11, marginTop: 2 }}>{part.brand}</p>
        {part.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {part.tags.map((tag) => (
              <span key={tag} style={{ fontSize: 10, border: '1px solid #888', padding: '0 4px' }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {part.price
          ? <span style={{ fontSize: 13, fontWeight: 700 }}>${part.price.toLocaleString()}</span>
          : <span style={{ fontSize: 13 }}>—</span>
        }
      </div>
    </CardItem>
  )
}
