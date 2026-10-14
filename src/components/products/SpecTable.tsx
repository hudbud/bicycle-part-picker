import styled from 'styled-components'
import type { Part } from '@/types/parts'
import { getSpecFields, getSpecValue, formatSpecValue, formatWeight } from '@/data/specSchema'
import { getCategoryLabel } from '@/data/categoryConfig'
import { formatPrice } from '@/utils/format'
import { humanizeKey } from './productUtils'

const T = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--win-window);
  color: var(--win-window-text);
  border: 2px solid;
  border-color: var(--win-shadow) var(--win-hilight) var(--win-hilight) var(--win-shadow);
  font-size: 12px;

  th,
  td {
    padding: 5px 8px;
    border-bottom: 1px solid var(--win-stripe);
    text-align: left;
    vertical-align: top;
  }
  th {
    width: 32%;
    max-width: 220px;
    font-weight: 700;
    background: var(--win-stripe);
  }
  tr.section th {
    background: var(--win-title);
    color: var(--win-title-text);
    font-size: 11px;
    letter-spacing: 0.5px;
  }
`

/** Every schema field (missing → '—'), plus any legacy free-form specs and tags. */
export function SpecTable({ part }: { part: Part }) {
  const fields = getSpecFields(part.category)
  const hasWeightField = fields.some((f) => f.key === 'weightG')
  const legacy = Object.entries(part.specs ?? {}).filter(([, v]) => v != null && v !== '')

  return (
    <T>
      <tbody>
        <tr>
          <th>Manufacturer</th>
          <td>{part.brand}</td>
        </tr>
        <tr>
          <th>Model</th>
          <td>{part.name}</td>
        </tr>
        <tr>
          <th>Category</th>
          <td>{getCategoryLabel(part.category) ?? part.category}</td>
        </tr>
        {!part.isCustom && (
          <tr>
            <th>Production</th>
            <td>
              {part.discontinued ? 'Discontinued — used / NOS market only' : 'Current production'}
              {part.year ? ` · ${part.year}` : ''}
            </td>
          </tr>
        )}
        <tr>
          <th>{part.isCustom ? 'Your price' : part.discontinued ? 'Typical used value' : 'MSRP'}</th>
          <td>{formatPrice(part.price)}</td>
        </tr>
        {!hasWeightField && (
          <tr>
            <th>Weight</th>
            <td>{formatWeight(part.weightG)}</td>
          </tr>
        )}
        {fields.map((f) => (
          <tr key={f.key}>
            <th>{f.label}</th>
            <td>{formatSpecValue(f, getSpecValue(part, f.key))}</td>
          </tr>
        ))}
        {legacy.length > 0 && (
          <>
            <tr className="section">
              <th colSpan={2}>Listed specs</th>
            </tr>
            {legacy.map(([k, v]) => (
              <tr key={k}>
                <th>{humanizeKey(k)}</th>
                <td>{String(v)}</td>
              </tr>
            ))}
          </>
        )}
        {part.tags.length > 0 && (
          <tr>
            <th>Tags</th>
            <td>{part.tags.join(', ')}</td>
          </tr>
        )}
        {part.url && (
          <tr>
            <th>Link</th>
            <td>
              <a href={part.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--win-link)', wordBreak: 'break-all' }}>
                {part.url}
              </a>
            </td>
          </tr>
        )}
      </tbody>
    </T>
  )
}
