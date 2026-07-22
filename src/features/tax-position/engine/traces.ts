import { ENGINE_VERSION } from '@/features/tax-position/engine/constants'
import { claimReviewLinesForCategory } from '@/features/tax-position/engine/claim-review-lines'
import { summarizeTaxYear } from '@/features/tax-position/engine/summarize'
import type { ClaimReviewLine, TaxPlannerState } from '@/features/tax-position/engine/types'

export type CalculationTrace = {
  id: string
  label: string
  /** Where the inputs come from */
  source: string
  /** Human-readable formula (Calculator-compatible) */
  calculation: string
  /** AUD result */
  resultAud: number
  engineVersion: string
  /** Line-level claims for drill-in review (date · description · amount) */
  lines?: ClaimReviewLine[]
}

/**
 * Explains summary figures without altering summarizeTaxYear maths.
 * Source · Calculation · Result for trust (U11–U12).
 */
export function buildCalculationTraces(
  state: TaxPlannerState,
  fyEndYear: number,
): CalculationTrace[] {
  const year = state.years.find((y) => y.fyEndYear === fyEndYear)
  if (!year) return []
  const rates = state.ratesByFy[String(fyEndYear)] ?? []
  const summary = summarizeTaxYear(year, rates)
  const v = summary.engineVersion || ENGINE_VERSION

  const monthCount = year.monthlyIncome.length
  const sampleRate = year.monthlyIncome[0]?.usdAudRate

  const workLines = claimReviewLinesForCategory(year, 'work')
  const flightLines = claimReviewLinesForCategory(year, 'flight')
  const transportLines = claimReviewLinesForCategory(year, 'transport')
  const carKmLines = claimReviewLinesForCategory(year, 'car-km')
  const laundryLines = claimReviewLinesForCategory(year, 'laundry')
  const apartmentLines = claimReviewLinesForCategory(year, 'apartment')

  const traces: CalculationTrace[] = [
    {
      id: 'employment-income',
      label: 'Employment income',
      source: `${monthCount} monthly employment row(s) (USD 5th/20th + snapshotted USD/AUD rate)`,
      calculation:
        sampleRate != null
          ? `For each month: (USD 5th + USD 20th) ÷ usdAudRate (units per A$1)${sampleRate ? `; e.g. rate ${sampleRate}` : ''}. Sum months.`
          : 'Sum of monthly USD ÷ snapshotted USD/AUD rates.',
      resultAud: summary.employmentIncomeAud,
      engineVersion: v,
    },
    {
      id: 'interest-income',
      label: 'Interest income',
      source: `${year.interestByAccount.length} interest entry(ies)`,
      calculation: 'Sum of grossInterestAud (AUD).',
      resultAud: summary.interestIncomeAud,
      engineVersion: v,
    },
    {
      id: 'dividend-income',
      label: 'Dividend income',
      source: `${year.dividends.length} dividend entry(ies)`,
      calculation: 'Sum of franked + unfranked + franking credits (assessable).',
      resultAud: summary.dividendIncomeAud,
      engineVersion: v,
    },
    {
      id: 'rental-income',
      label: 'Net rental income',
      source: `${year.rentalProperties.length} rental property(ies)`,
      calculation: 'Sum of (grossRentAud − expensesAud).',
      resultAud: summary.rentalIncomeAud,
      engineVersion: v,
    },
    {
      id: 'capital-gains',
      label: 'Capital gains',
      source: `${year.capitalGains.length} CGT row(s)`,
      calculation: 'max(0, proceeds − cost base); × 50% if discountEligible.',
      resultAud: summary.capitalGainsAud,
      engineVersion: v,
    },
    {
      id: 'other-investment',
      label: 'Other investment income',
      source: `${year.otherInvestments.length} other investment row(s)`,
      calculation: 'Sum of grossAud.',
      resultAud: summary.otherInvestmentAud,
      engineVersion: v,
    },
    {
      id: 'total-income',
      label: 'Total income',
      source: 'Employment + interest + dividends + rental + CGT + other investment',
      calculation: 'Sum of income components above.',
      resultAud: summary.totalIncomeAud,
      engineVersion: v,
    },
    {
      id: 'overseas-daily',
      label: 'Overseas overnight claim',
      source: `Overnight planner nights × destination daily rates (sample-day averages write into rates when completed)${year.overseasDailyOverrideAud != null ? ' · year override applied' : ''}`,
      calculation:
        year.overseasDailyOverrideAud != null
          ? `Calculated ${summary.overseasDailyCalculatedAud.toFixed(2)} AUD from nights × rates; override ${year.overseasDailyOverrideAud} AUD used for claims. Open Tax Position overnight panel for per-destination sample-day provenance.`
          : 'Sum of (qualifying overnights × destination dailyRateAud) for the FY — same path as AJX Calculator. Per-destination sample days and averages are shown on Tax Position.',
      resultAud: summary.overseasDailyAud,
      engineVersion: v,
    },
    {
      id: 'other-claims',
      label: 'Work expenses',
      source: `${year.otherClaims.length} work claim row(s)`,
      calculation: 'Each: (localAmount ÷ exchangeRate) × (workPercentage / 100); or manual AUD.',
      resultAud: summary.otherClaimsAud,
      engineVersion: v,
      lines: workLines,
    },
    {
      id: 'flights',
      label: 'Flights',
      source: `${year.flights.length} flight claim(s)`,
      calculation: 'Each: (localAmount ÷ exchange rate) × work%; exchange rate = foreign units per A$1.',
      resultAud: summary.flightsAud,
      engineVersion: v,
      lines: flightLines,
    },
    {
      id: 'transport',
      label: 'Transport',
      source: `${year.transport.length} transport claim(s)`,
      calculation: 'Each: (localAmount ÷ exchangeRate) × work%; optional manual audAmount.',
      resultAud: summary.transportAud,
      engineVersion: v,
      lines: transportLines,
    },
    {
      id: 'car-km',
      label: 'Car kilometres',
      source: `${year.carKm.length} car km claim(s)`,
      calculation: `FIFO annual cap 5,000 km; claimable km × (centsPerKm / 100). Entered ${summary.carKmEntered} km → claimable ${summary.carKmClaimable} km.`,
      resultAud: summary.carKmAud,
      engineVersion: v,
      lines: carKmLines,
    },
    {
      id: 'laundry',
      label: 'Laundry',
      source: `${year.laundry.length} laundry row(s)`,
      calculation: 'Each: localAmount ÷ exchangeRate (typically JPY).',
      resultAud: summary.laundryAud,
      engineVersion: v,
      lines: laundryLines,
    },
    {
      id: 'apartment',
      label: 'Apartment costs',
      source: `${year.apartmentCosts.length} apartment row(s)`,
      calculation: 'Each: localAmount ÷ exchangeRate.',
      resultAud: summary.apartmentCostsAud,
      engineVersion: v,
      lines: apartmentLines,
    },
    {
      id: 'superannuation',
      label: 'Superannuation',
      source: 'Year settings',
      calculation: 'superannuationAud as entered for the FY.',
      resultAud: summary.superannuationAud,
      engineVersion: v,
    },
    {
      id: 'total-claims',
      label: 'Total claims',
      source: 'Super + overseas daily + work + flights + transport + car km + laundry + apartment',
      calculation: 'Sum of claim components.',
      resultAud: summary.totalClaimsAud,
      engineVersion: v,
    },
    {
      id: 'taxable-income',
      label: 'Taxable income',
      source: 'Total income and total claims',
      calculation: 'totalIncomeAud − totalClaimsAud.',
      resultAud: summary.taxableIncomeAud,
      engineVersion: v,
    },
    {
      id: 'gross-income-tax',
      label: 'Gross income tax',
      source: 'Stage 3 resident brackets',
      calculation: 'Progressive tax on taxable income (0 / 16% / 30% / 37% / 45%).',
      resultAud: summary.grossIncomeTaxAud,
      engineVersion: v,
    },
    {
      id: 'tax-offsets',
      label: 'Tax offsets',
      source: 'Franking credits + TFN withheld + foreign tax paid',
      calculation: 'Sum of offset components; income tax = max(0, gross − offsets).',
      resultAud: summary.taxOffsetsAud,
      engineVersion: v,
    },
    {
      id: 'income-tax',
      label: 'Income tax',
      source: 'Gross tax and offsets',
      calculation: 'max(0, grossIncomeTaxAud − taxOffsetsAud).',
      resultAud: summary.incomeTaxAud,
      engineVersion: v,
    },
    {
      id: 'medicare-levy',
      label: 'Medicare levy',
      source: year.includeMedicareLevy ? 'Year settings (Medicare on)' : 'Year settings (Medicare off)',
      calculation: year.includeMedicareLevy
        ? 'max(0, taxableIncomeAud) × 2%.'
        : '0 (includeMedicareLevy is false).',
      resultAud: summary.medicareLevyAud,
      engineVersion: v,
    },
    {
      id: 'estimated-tax',
      label: 'Estimated tax payable',
      source: 'Income tax + Medicare levy',
      calculation: 'incomeTaxAud + medicareLevyAud (indicative working paper).',
      resultAud: summary.estimatedTaxAud,
      engineVersion: v,
    },
  ]

  return traces
}
