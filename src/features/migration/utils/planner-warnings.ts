import type { TaxPlannerState } from '@/features/tax-position/engine'
import type { ImportWarning } from '@/features/migration/types/import'
import { loadPlanner } from '@/shared/lib/local-data-store'

function fyLabel(fyEndYear: number) {
  return `${fyEndYear - 1}–${String(fyEndYear).slice(2)}`
}

function countClaims(year: TaxPlannerState['years'][number]) {
  return (
    year.otherClaims.length +
    year.flights.length +
    year.transport.length +
    year.carKm.length +
    year.laundry.length +
    year.apartmentCosts.length
  )
}

/** Soft warnings — never block import. */
export function analyzePlannerWarnings(
  state: TaxPlannerState,
  opts?: {
    sourceChecksum?: string | null
    alreadyImportedChecksums?: Set<string>
    receiptFoldersByFy?: Record<number, unknown[]>
  },
): ImportWarning[] {
  const warnings: ImportWarning[] = []
  const existing = loadPlanner(state.activeFyEndYear)
  const existingFys = new Set(existing.years.map((y) => y.fyEndYear))
  const destIds = new Set(state.destinations.map((d) => d.id))

  if (opts?.sourceChecksum && opts.alreadyImportedChecksums?.has(opts.sourceChecksum)) {
    warnings.push({
      code: 'ALREADY_IMPORTED',
      message:
        'This backup looks identical to one you already imported. Re-import will merge by id and keep existing rows that are not in the file.',
    })
  }

  for (const year of state.years) {
    if (existingFys.has(year.fyEndYear)) {
      warnings.push({
        code: 'FY_MERGE',
        path: `years[${year.fyEndYear}]`,
        message: `FY ${fyLabel(year.fyEndYear)} already exists in AJX Tax. Matching ids will update; your other rows stay.`,
      })
    }

    let carKmTotal = 0
    for (const row of year.carKm) {
      carKmTotal += row.kilometres
    }
    if (carKmTotal > 5000) {
      warnings.push({
        code: 'CAR_KM_HIGH',
        path: `years[${year.fyEndYear}].carKm`,
        message: `FY ${fyLabel(year.fyEndYear)} car kilometres total ${Math.round(carKmTotal)} (over 5,000). Review after import.`,
      })
    }

    for (const claim of [...year.otherClaims, ...year.flights, ...year.transport]) {
      if (claim.exchangeRate <= 0 && claim.currencyCode !== 'AUD') {
        warnings.push({
          code: 'FX_RATE_ZERO',
          path: `years[${year.fyEndYear}].claims`,
          message: `A ${claim.currencyCode} claim has exchange rate 0 — AUD may be wrong until you fix the rate.`,
        })
        break
      }
    }

    for (const away of year.monthAway) {
      if (away.destinationId && !destIds.has(away.destinationId)) {
        warnings.push({
          code: 'ORPHAN_DESTINATION',
          path: `years[${year.fyEndYear}].monthAway`,
          message: `Nights reference destination ${away.destinationId} which is not in this backup’s destinations list.`,
        })
      }
    }

    if (countClaims(year) === 0 && year.monthlyIncome.every((m) => m.incomeUsd === 0)) {
      warnings.push({
        code: 'EMPTY_YEAR',
        path: `years[${year.fyEndYear}]`,
        message: `FY ${fyLabel(year.fyEndYear)} has no income or claims in the backup.`,
      })
    }

    const folders = opts?.receiptFoldersByFy?.[year.fyEndYear]
    if (folders && folders.length > 0) {
      warnings.push({
        code: 'RECEIPT_FOLDERS_SKIPPED',
        path: `years[${year.fyEndYear}].receiptFolders`,
        message: `FY ${fyLabel(year.fyEndYear)} has receipt folders in the backup. They are retained in the migration log but not mapped into Tax Position yet.`,
      })
    }
  }

  for (const [fy, rates] of Object.entries(state.ratesByFy)) {
    for (const rate of rates) {
      if (rate.destinationId && !destIds.has(rate.destinationId)) {
        warnings.push({
          code: 'ORPHAN_RATE',
          path: `ratesByFy.${fy}`,
          message: `Daily rate for destination ${rate.destinationId} has no matching destination — rate will still be stored.`,
        })
      }
    }
  }

  return warnings
}
