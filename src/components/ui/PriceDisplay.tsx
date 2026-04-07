interface PriceDisplayProps {
  price?: number
  missing?: boolean
  prefix?: '~' | ''
  className?: string
}

export function PriceDisplay({ price, missing = false, prefix = '', className = '' }: PriceDisplayProps) {
  if (price === undefined || price === 0) {
    return <span className={`text-text-muted ${className}`}>—</span>
  }
  return (
    <span className={className}>
      {missing ? '~' : prefix}${price.toLocaleString()}
    </span>
  )
}
