import { lookupAtoRateForMonth } from '@/features/tax-position/engine'
import type { TaxPlannerState, TaxYearRecord } from '@/features/tax-position/engine/types'
import { computeReceiptAud, type SampleDay } from '@/features/destination-workspace/types/sample-day'
import {
  listSampleDaysForFy,
  replaceSampleDaysForFy,
} from '@/features/destination-workspace/services/sample-day-store'

export type AtoRefreshSummary = {
  claimRowsUpdated: number
  incomeRowsUpdated: number
  sampleReceiptsUpdated: number
  pendingStillMissing: number
}

function parseDateYmd(dateYmd?: string | null): { year: number; month: number } | null {
  if (!dateYmd?.trim()) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd.trim())
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) }
}

function parseMonthKey(monthKey?: string | null): { year: number; month: number } | null {
  if (!monthKey?.trim()) return null
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim())
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) }
}

/** Rows marked for ATO tracking, or still waiting on a rate (0 / missing). */
function isAtoEligible(
  row: {
    rateFromAto?: boolean
    manualAud?: boolean
    exchangeRate: number
    currencyCode?: string
  },
  impliedCurrency = 'AUD',
): boolean {
  if (row.manualAud) return false
  if (row.rateFromAto === false) return false
  const code = (row.currencyCode ?? impliedCurrency).toUpperCase()
  if (code === 'AUD') return false
  return row.rateFromAto === true || !(row.exchangeRate > 0)
}

function applyRateToClaimRow<
  T extends {
    dateYmd?: string
    exchangeRate: number
    rateFromAto?: boolean
    manualAud?: boolean
    currencyCode?: string
  },
>(row: T, impliedCurrency: string, counts: { updated: number; pending: number }): T {
  if (!isAtoEligible(row, impliedCurrency)) return row
  const code = (row.currencyCode ?? impliedCurrency).toUpperCase()
  const parts = parseDateYmd(row.dateYmd)
  if (!parts) {
    if (!(row.exchangeRate > 0)) counts.pending += 1
    return row
  }
  const ato = lookupAtoRateForMonth(code, parts.year, parts.month)
  if (!ato) {
    if (!(row.exchangeRate > 0)) counts.pending += 1
    return row
  }
  if (row.exchangeRate === ato.unitsPerAud && row.rateFromAto) return row
  counts.updated += 1
  return {
    ...row,
    exchangeRate: ato.unitsPerAud,
    rateFromAto: true,
  }
}

function refreshYear(year: TaxYearRecord, counts: AtoRefreshSummary): TaxYearRecord {
  const claimCounts = { updated: 0, pending: 0 }

  const otherClaims = year.otherClaims.map((row) =>
    applyRateToClaimRow(row, row.currencyCode, claimCounts),
  )
  const flights = year.flights.map((row) =>
    applyRateToClaimRow(row, row.currencyCode, claimCounts),
  )
  const transport = year.transport.map((row) =>
    applyRateToClaimRow(row, row.currencyCode, claimCounts),
  )
  const laundry = year.laundry.map((row) => {
    const next = applyRateToClaimRow({ ...row, currencyCode: 'JPY' }, 'JPY', claimCounts)
    const { currencyCode: _c, ...rest } = next
    return rest
  })
  const apartmentCosts = year.apartmentCosts.map((row) => {
    const next = applyRateToClaimRow({ ...row, currencyCode: 'JPY' }, 'JPY', claimCounts)
    const { currencyCode: _c, ...rest } = next
    return rest
  })

  let incomeUpdated = 0
  const monthlyIncome = year.monthlyIncome.map((row) => {
    if (row.usdAudFromAto === false) return row
    const parts = parseMonthKey(row.monthKey)
    if (!parts) return row
    const ato = lookupAtoRateForMonth('USD', parts.year, parts.month)
    if (!ato) {
      if (!(row.usdAudRate > 0)) counts.pendingStillMissing += 1
      return row
    }
    if (row.usdAudRate === ato.unitsPerAud && row.usdAudFromAto) return row
    incomeUpdated += 1
    return {
      ...row,
      usdAudRate: ato.unitsPerAud,
      usdAudFromAto: true,
    }
  })

  counts.claimRowsUpdated += claimCounts.updated
  counts.pendingStillMissing += claimCounts.pending
  counts.incomeRowsUpdated += incomeUpdated

  return {
    ...year,
    otherClaims,
    flights,
    transport,
    laundry,
    apartmentCosts,
    monthlyIncome,
  }
}

function refreshSampleDays(fyEndYear: number, counts: AtoRefreshSummary): void {
  const days = listSampleDaysForFy(fyEndYear)
  let changed = false
  const next = days.map((day) => {
    let dayChanged = false
    const receipts = day.receipts.map((receipt) => {
      const code = receipt.currencyCode.toUpperCase()
      if (code === 'AUD') return receipt
      // Only fill pending (missing) rates — do not overwrite typed sample-day FX.
      if (receipt.exchangeRate > 0) return receipt
      const parts = parseDateYmd(day.completedAt?.slice(0, 10) ?? day.createdAt.slice(0, 10))
      if (!parts) {
        counts.pendingStillMissing += 1
        return receipt
      }
      const ato = lookupAtoRateForMonth(code, parts.year, parts.month)
      if (!ato) {
        counts.pendingStillMissing += 1
        return receipt
      }
      dayChanged = true
      counts.sampleReceiptsUpdated += 1
      return {
        ...receipt,
        exchangeRate: ato.unitsPerAud,
        amountAud: computeReceiptAud(receipt.localAmount, code, ato.unitsPerAud),
      }
    })
    if (!dayChanged) return day
    changed = true
    return { ...day, receipts, updatedAt: new Date().toISOString() } satisfies SampleDay
  })
  if (changed) replaceSampleDaysForFy(fyEndYear, next)
}

/**
 * Apply published ATO monthly rates to ATO-tracked / pending FX rows.
 * Manual rates (`rateFromAto: false` / `manualAud`) are left unchanged.
 */
export function refreshAtoRatesOnPlanner(planner: TaxPlannerState): {
  planner: TaxPlannerState
  summary: AtoRefreshSummary
} {
  const summary: AtoRefreshSummary = {
    claimRowsUpdated: 0,
    incomeRowsUpdated: 0,
    sampleReceiptsUpdated: 0,
    pendingStillMissing: 0,
  }

  const years = planner.years.map((year) => {
    const next = refreshYear(year, summary)
    refreshSampleDays(year.fyEndYear, summary)
    return next
  })

  return {
    planner: { ...planner, years },
    summary,
  }
}
