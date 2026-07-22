/** Sample days — representative days that feed average daily spend. */

export type SampleDayStatus = 'in_progress' | 'complete'

export const SAMPLE_CURRENCIES = [
  'AUD',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'THB',
  'SGD',
  'NZD',
  'HKD',
  'CAD',
] as const

export type SampleCurrency = (typeof SAMPLE_CURRENCIES)[number]

export const RECEIPT_CATEGORIES = [
  'meals',
  'transport',
  'accommodation',
  'incidentals',
  'other',
] as const

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number]

export const RECEIPT_CATEGORY_LABELS: Record<ReceiptCategory, string> = {
  meals: 'Meals',
  transport: 'Transport',
  accommodation: 'Accommodation',
  incidentals: 'Incidentals',
  other: 'Other',
}

export function isReceiptCategory(value: string): value is ReceiptCategory {
  return (RECEIPT_CATEGORIES as readonly string[]).includes(value)
}

export type SampleDayReceipt = {
  id: string
  description: string
  category: ReceiptCategory
  currencyCode: string
  /** Amount in the receipt currency */
  localAmount: number
  /**
   * Foreign units per A$1 (ATO / Calculator convention).
   * For AUD use 1. AUD = localAmount ÷ exchangeRate.
   */
  exchangeRate: number
  /** Snapshotted AUD equivalent */
  amountAud: number
  notes: string
  /** Optional attached image (data URL) for quick mobile capture */
  imageDataUrl: string | null
  imageFileName: string | null
  /** Optional link to an Evidence Vault document */
  evidenceId: string | null
}

export type SampleDay = {
  id: string
  destinationId: string
  fyEndYear: number
  label: string
  status: SampleDayStatus
  notes: string
  receipts: SampleDayReceipt[]
  /** Evidence ids linked to this sample day (in addition to per-receipt links) */
  linkedEvidenceIds: string[]
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export function computeReceiptAud(
  localAmount: number,
  currencyCode: string,
  exchangeRate: number,
): number {
  if (!Number.isFinite(localAmount)) return 0
  if (currencyCode === 'AUD' || !(exchangeRate > 0)) return localAmount
  return localAmount / exchangeRate
}

export function sampleDayTotalAud(day: SampleDay): number {
  return day.receipts.reduce(
    (sum, r) => sum + computeReceiptAud(r.localAmount, r.currencyCode, r.exchangeRate),
    0,
  )
}

/**
 * Average daily spend from completed sample days only.
 * Days still being edited never affect the average.
 */
export function averageDailySpendAud(days: SampleDay[]): number | null {
  const complete = days.filter((d) => d.status === 'complete')
  if (complete.length === 0) return null
  const total = complete.reduce((sum, d) => sum + sampleDayTotalAud(d), 0)
  return total / complete.length
}

export function primaryCurrency(day: SampleDay): string {
  if (day.receipts.length === 0) return 'AUD'
  const counts = new Map<string, number>()
  for (const r of day.receipts) {
    counts.set(r.currencyCode, (counts.get(r.currencyCode) ?? 0) + 1)
  }
  let best = 'AUD'
  let bestCount = 0
  for (const [code, n] of counts) {
    if (n > bestCount) {
      best = code
      bestCount = n
    }
  }
  return best
}

export function completionStatusLabel(status: SampleDayStatus): string {
  return status === 'complete' ? 'Completed' : 'In progress'
}

export function createEmptyReceipt(
  defaults?: Partial<Pick<SampleDayReceipt, 'currencyCode' | 'category' | 'exchangeRate'>>,
): SampleDayReceipt {
  const currencyCode = defaults?.currencyCode ?? 'AUD'
  return {
    id: crypto.randomUUID(),
    description: '',
    category: defaults?.category ?? 'meals',
    currencyCode,
    localAmount: 0,
    exchangeRate: currencyCode === 'AUD' ? 1 : (defaults?.exchangeRate ?? 1),
    amountAud: 0,
    notes: '',
    imageDataUrl: null,
    imageFileName: null,
    evidenceId: null,
  }
}

/** Migrate legacy rows that only had amountAud. */
export function normalizeSampleDay(raw: SampleDay & Record<string, unknown>): SampleDay {
  const receiptsRaw = Array.isArray(raw.receipts) ? raw.receipts : []
  const receipts: SampleDayReceipt[] = receiptsRaw.map((r) => {
    const row = r as Partial<SampleDayReceipt> & { amountAud?: number }
    const currencyCode = typeof row.currencyCode === 'string' ? row.currencyCode : 'AUD'
    const localAmount =
      typeof row.localAmount === 'number'
        ? row.localAmount
        : typeof row.amountAud === 'number'
          ? row.amountAud
          : 0
    const exchangeRate =
      typeof row.exchangeRate === 'number' && row.exchangeRate > 0 ? row.exchangeRate : 1
    const amountAud = computeReceiptAud(localAmount, currencyCode, exchangeRate)
    const category =
      typeof row.category === 'string' && isReceiptCategory(row.category) ? row.category : 'other'
    return {
      id: typeof row.id === 'string' ? row.id : crypto.randomUUID(),
      description: typeof row.description === 'string' ? row.description : '',
      category,
      currencyCode,
      localAmount,
      exchangeRate,
      amountAud,
      notes: typeof row.notes === 'string' ? row.notes : '',
      imageDataUrl:
        typeof row.imageDataUrl === 'string' || row.imageDataUrl === null
          ? row.imageDataUrl ?? null
          : null,
      imageFileName:
        typeof row.imageFileName === 'string' || row.imageFileName === null
          ? row.imageFileName ?? null
          : null,
      evidenceId:
        typeof row.evidenceId === 'string' || row.evidenceId === null
          ? (row.evidenceId ?? null)
          : null,
    }
  })

  return {
    id: String(raw.id),
    destinationId: String(raw.destinationId),
    fyEndYear: typeof raw.fyEndYear === 'number' ? raw.fyEndYear : new Date().getFullYear(),
    label: typeof raw.label === 'string' ? raw.label : 'Sample day',
    status: raw.status === 'complete' ? 'complete' : 'in_progress',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    receipts,
    linkedEvidenceIds: Array.isArray(raw.linkedEvidenceIds)
      ? (raw.linkedEvidenceIds as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
    completedAt:
      typeof raw.completedAt === 'string' || raw.completedAt === null
        ? (raw.completedAt as string | null)
        : null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  }
}
