import {
  CAR_KM_ANNUAL_MAX,
  ENGINE_VERSION,
  MEDICARE_LEVY_RATE,
  PAY_PERIODS_PER_YEAR,
} from '@/features/tax-position/engine/constants'
import { claimAud, foreignToAud, stage3IncomeTax } from '@/features/tax-position/engine/math'
import type {
  ClaimLineAud,
  TaxPlannerState,
  TaxYearRecord,
  TaxYearSummary,
} from '@/features/tax-position/engine/types'

function fyLabel(fyEndYear: number): string {
  return `FY ${fyEndYear - 1}–${String(fyEndYear).slice(2)}`
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

export function summarizeTaxYear(
  year: TaxYearRecord,
  rates: { destinationId: string; dailyRateAud: number }[],
): TaxYearSummary {
  const employmentIncomeAud = sum(
    year.monthlyIncome.map((m) => foreignToAud(m.incomeUsd || m.incomeUsd5th + m.incomeUsd20th, m.usdAudRate)),
  )

  const interestIncomeAud = sum(year.interestByAccount.map((r) => r.grossInterestAud))
  const tfnInterest = sum(year.interestByAccount.map((r) => r.tfnWithheldAud))

  const dividendIncomeAud = sum(
    year.dividends.map((d) => d.frankedAud + d.unfrankedAud + d.frankingCreditsAud),
  )
  const frankingCreditsAud = sum(year.dividends.map((d) => d.frankingCreditsAud))
  const tfnDividends = sum(year.dividends.map((d) => d.tfnWithheldAud))

  const rentalIncomeAud = sum(year.rentalProperties.map((r) => r.grossRentAud - r.expensesAud))

  const capitalGainsAud = sum(
    year.capitalGains.map((g) => {
      const gain = Math.max(0, g.proceedsAud - g.costBaseAud)
      return g.discountEligible ? gain * 0.5 : gain
    }),
  )

  const otherInvestmentAud = sum(year.otherInvestments.map((o) => o.grossAud))
  const foreignTaxOffsetAud = sum(year.otherInvestments.map((o) => o.foreignTaxPaidAud))

  const totalIncomeAud =
    employmentIncomeAud +
    interestIncomeAud +
    dividendIncomeAud +
    rentalIncomeAud +
    capitalGainsAud +
    otherInvestmentAud

  const rateMap = new Map(rates.map((r) => [r.destinationId, r.dailyRateAud]))
  const overseasDailyCalculatedAud = sum(
    year.monthAway.map((m) => m.nights * (rateMap.get(m.destinationId) ?? 0)),
  )
  const overseasDailyAud =
    year.overseasDailyOverrideAud != null ? year.overseasDailyOverrideAud : overseasDailyCalculatedAud

  const otherClaimsAud = sum(
    year.otherClaims.map((c) =>
      claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.amountAud,
      }),
    ),
  )

  const flightsAud = sum(
    year.flights.map((c) => claimAud(c.localAmount, c.exchangeRate, c.workPercentage)),
  )

  const transportAud = sum(
    year.transport.map((c) =>
      claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.audAmount,
      }),
    ),
  )

  const carKmEntered = sum(year.carKm.map((c) => c.kilometres))
  let remainingCap = CAR_KM_ANNUAL_MAX
  let carKmClaimable = 0
  let carKmAud = 0
  for (const claim of year.carKm) {
    const claimable = Math.min(claim.kilometres, remainingCap)
    remainingCap -= claimable
    carKmClaimable += claimable
    carKmAud += claimable * (claim.centsPerKm / 100)
  }

  const laundryAud = sum(year.laundry.map((c) => foreignToAud(c.localAmount, c.exchangeRate)))
  const apartmentCostsAud = sum(
    year.apartmentCosts.map((c) => foreignToAud(c.localAmount, c.exchangeRate)),
  )

  const superannuationAud = year.superannuationAud
  const totalClaimsAud =
    superannuationAud +
    overseasDailyAud +
    otherClaimsAud +
    flightsAud +
    transportAud +
    carKmAud +
    laundryAud +
    apartmentCostsAud

  const taxableIncomeAud = totalIncomeAud - totalClaimsAud
  const { tax: grossIncomeTaxAud, rows: bracketRows } = stage3IncomeTax(taxableIncomeAud)

  const tfnWithheldAud = tfnInterest + tfnDividends
  const taxOffsetsAud = frankingCreditsAud + tfnWithheldAud + foreignTaxOffsetAud
  const incomeTaxAud = Math.max(0, grossIncomeTaxAud - taxOffsetsAud)
  const medicareLevyAud = year.includeMedicareLevy
    ? Math.max(0, taxableIncomeAud) * MEDICARE_LEVY_RATE
    : 0
  const estimatedTaxAud = incomeTaxAud + medicareLevyAud
  const effectiveRate = taxableIncomeAud > 0 ? estimatedTaxAud / taxableIncomeAud : 0
  const paygPerPay = estimatedTaxAud / PAY_PERIODS_PER_YEAR

  return {
    engineVersion: ENGINE_VERSION,
    fyEndYear: year.fyEndYear,
    fyLabel: fyLabel(year.fyEndYear),
    employmentIncomeAud,
    interestIncomeAud,
    dividendIncomeAud,
    rentalIncomeAud,
    capitalGainsAud,
    otherInvestmentAud,
    totalIncomeAud,
    superannuationAud,
    overseasDailyAud,
    overseasDailyCalculatedAud,
    otherClaimsAud,
    flightsAud,
    transportAud,
    carKmAud,
    carKmEntered,
    carKmClaimable,
    laundryAud,
    apartmentCostsAud,
    totalClaimsAud,
    taxableIncomeAud,
    frankingCreditsAud,
    tfnWithheldAud,
    foreignTaxOffsetAud,
    taxOffsetsAud,
    grossIncomeTaxAud,
    incomeTaxAud,
    medicareLevyAud,
    estimatedTaxAud,
    effectiveRate,
    paygPerPay,
    bracketRows,
  }
}

export function summarizeFromPlanner(state: TaxPlannerState, fyEndYear: number): TaxYearSummary | null {
  const year = state.years.find((y) => y.fyEndYear === fyEndYear)
  if (!year) return null
  const rates = state.ratesByFy[String(fyEndYear)] ?? []
  return summarizeTaxYear(year, rates)
}

export function claimLinesForYear(
  year: TaxYearRecord,
  rates: { destinationId: string; dailyRateAud: number }[],
): ClaimLineAud[] {
  const lines: ClaimLineAud[] = []
  for (const c of year.otherClaims) {
    lines.push({
      id: c.id,
      kind: 'work',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.amountAud,
      }),
    })
  }
  for (const c of year.flights) {
    lines.push({
      id: c.id,
      kind: 'flight',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage),
    })
  }
  for (const c of year.transport) {
    lines.push({
      id: c.id,
      kind: 'transport',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.audAmount,
      }),
    })
  }
  const rateMap = new Map(rates.map((r) => [r.destinationId, r.dailyRateAud]))
  for (const m of year.monthAway) {
    lines.push({
      id: m.id,
      kind: 'overseas-nights',
      amountAud: m.nights * (rateMap.get(m.destinationId) ?? 0),
    })
  }
  return lines
}

export function emptyTaxYear(fyEndYear: number): TaxYearRecord {
  return {
    fyEndYear,
    superannuationAud: 0,
    overseasDailyOverrideAud: null,
    includeMedicareLevy: true,
    monthlyIncome: [],
    monthAway: [],
    otherClaims: [],
    flights: [],
    transport: [],
    carKm: [],
    laundry: [],
    apartmentCosts: [],
    interestByAccount: [],
    dividends: [],
    rentalProperties: [],
    capitalGains: [],
    otherInvestments: [],
    notes: '',
  }
}

export function emptyPlanner(fyEndYear: number): TaxPlannerState {
  return {
    schemaVersion: 2,
    destinations: [],
    bankAccounts: [],
    ratesByFy: {},
    years: [emptyTaxYear(fyEndYear)],
    activeFyEndYear: fyEndYear,
    overseasAtoSalaryTable: '7',
  }
}
