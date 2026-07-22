export function formatAud(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

/** Format YYYY-MM-DD for en-AU display (e.g. 21/04/2020). */
export function formatDateYmd(dateYmd: string | undefined | null): string | null {
  if (!dateYmd?.trim()) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateYmd.trim())
  if (!m) return dateYmd.trim()
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  if (Number.isNaN(d.getTime())) return dateYmd.trim()
  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
