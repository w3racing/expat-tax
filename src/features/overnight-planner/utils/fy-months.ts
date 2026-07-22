/** Australian FY months: July (start) → June (end). */

export function fyMonthKeys(fyEndYear: number): string[] {
  const startYear = fyEndYear - 1
  const keys: string[] = []
  for (let month = 7; month <= 12; month += 1) {
    keys.push(`${startYear}-${String(month).padStart(2, '0')}`)
  }
  for (let month = 1; month <= 6; month += 1) {
    keys.push(`${fyEndYear}-${String(month).padStart(2, '0')}`)
  }
  return keys
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** e.g. 2025-07 → "Jul" */
export function monthShortLabel(monthKey: string): string {
  const month = Number(monthKey.slice(5, 7))
  if (!Number.isFinite(month) || month < 1 || month > 12) return monthKey
  return SHORT_MONTHS[month - 1]!
}

/** e.g. 2025-07 → "Jul 2025" */
export function monthLongLabel(monthKey: string): string {
  const year = monthKey.slice(0, 4)
  return `${monthShortLabel(monthKey)} ${year}`
}
