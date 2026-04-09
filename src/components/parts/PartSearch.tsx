import { TextInput } from 'react95'

interface PartSearchProps {
  value: string
  onChange: (v: string) => void
}

export function PartSearch({ value, onChange }: PartSearchProps) {
  return (
    <TextInput
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search parts…"
      fullWidth
      autoFocus
    />
  )
}
