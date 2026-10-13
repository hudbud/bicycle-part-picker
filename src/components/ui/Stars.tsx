import type { Rating } from '@/data/pricing'

/** ★★★★☆ (123) — text stars so they render in the pixel font. */
export function Stars({ rating, showCount = true }: { rating: Rating | undefined; showCount?: boolean }) {
  if (!rating || rating.count === 0) {
    return <span style={{ fontSize: 11, opacity: 0.6 }}>No ratings</span>
  }
  const full = Math.round(rating.avg)
  return (
    <span style={{ fontSize: 11, whiteSpace: 'nowrap' }} aria-label={`Rated ${rating.avg} out of 5 by ${rating.count} riders`}>
      <span style={{ color: '#b8860b', letterSpacing: -1 }}>{'★'.repeat(full)}</span>
      <span style={{ color: '#808080', letterSpacing: -1 }}>{'★'.repeat(5 - full)}</span>
      {showCount && <span style={{ marginLeft: 4 }}>({rating.count})</span>}
    </span>
  )
}
