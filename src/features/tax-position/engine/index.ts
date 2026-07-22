export { ENGINE_VERSION } from '@/features/tax-position/engine/constants'
export {
  summarizeTaxYear,
  summarizeFromPlanner,
  claimLinesForYear,
  emptyTaxYear,
  emptyPlanner,
} from '@/features/tax-position/engine/summarize'
export { foreignToAud, claimAud, stage3IncomeTax } from '@/features/tax-position/engine/math'
export { buildCalculationTraces } from '@/features/tax-position/engine/traces'
export type { CalculationTrace } from '@/features/tax-position/engine/traces'
export {
  buildClaimReviewLines,
  claimReviewLinesForCategory,
} from '@/features/tax-position/engine/claim-review-lines'
export {
  getAtoExchangeRate,
  lookupAtoRateForMonth,
  listAtoCurrencies,
  listAtoRatesForCurrency,
} from '@/features/tax-position/engine/ato-fx'
export type { AtoExchangeRate } from '@/features/tax-position/engine/ato-fx'
export type {
  TaxPlannerState,
  TaxYearRecord,
  TaxYearSummary,
  ClaimLineAud,
  ClaimReviewLine,
  MonthlyIncome,
} from '@/features/tax-position/engine/types'
