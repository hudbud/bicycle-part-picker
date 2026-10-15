/** $1,234.56 — drops cents for whole-dollar amounts ≥ $1,000. */
export function formatPrice(n: number | undefined): string {
  if (n == null) return '—'
  const whole = Math.abs(n - Math.round(n)) < 0.005
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: whole && n >= 1000 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
