interface PriceDisplayProps {
  price?: number
  missing?: boolean
  prefix?: '~' | ''
  className?: string
  style?: React.CSSProperties
}

export function PriceDisplay({ price, missing = false, prefix = '', className, style }: PriceDisplayProps) {
  if (price === undefined || price === 0) {
    return <span className={className} style={style}>—</span>
  }
  return (
    <span className={className} style={style}>
      {missing ? '~' : prefix}${price.toLocaleString()}
    </span>
  )
}
