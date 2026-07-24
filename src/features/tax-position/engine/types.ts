export type TaxDestination = {
  id: string
  name: string
  sortOrder: number
}

export type DestinationRate = {
  destinationId: string
  dailyRateAud: number
}

export type BankAccount = {
  id: string
  label: string
  institution?: string
  sortOrder: number
}

export type MonthlyIncome = {
  id: string
  monthKey: string
  incomeUsd5th: number
  incomeUsd20th: number
  incomeUsd: number
  usdAudRate: number
  usdAudFromAto?: boolean
}

export type MonthAway = {
  id: string
  monthKey: string
  destinationId: string
  nights: number
}

export type WorkClaim = {
  id: string
  /** Claim date (YYYY-MM-DD) for audit / review */
  dateYmd?: string
  description?: string
  currencyCode: string
  localAmount: number
  exchangeRate: number
  amountAud?: number
  workPercentage: number
  manualAud?: boolean
  rateFromAto?: boolean
  evidenceVersionId?: string | null
}

export type FlightClaim = {
  id: string
  dateYmd?: string
  description?: string
  currencyCode: string
  localAmount: number
  exchangeRate: number
  workPercentage: number
  manualAud?: boolean
  rateFromAto?: boolean
  evidenceVersionId?: string | null
}

export type TransportKind = 'bus' | 'train' | 'taxi'

export type TransportClaim = {
  id: string
  dateYmd?: string
  description?: string
  /** Calculator / domain kind — bus, train, or taxi */
  kind?: TransportKind
  currencyCode: string
  localAmount: number
  exchangeRate: number
  workPercentage: number
  audAmount?: number
  manualAud?: boolean
  rateFromAto?: boolean
  evidenceVersionId?: string | null
}

export type CarKmClaim = {
  id: string
  dateYmd?: string
  kilometres: number
  centsPerKm: number
  description?: string
  evidenceVersionId?: string | null
}

export type LaundryClaim = {
  id: string
  dateYmd?: string
  description?: string
  localAmount: number
  exchangeRate: number
  manualAud?: boolean
  rateFromAto?: boolean
  evidenceVersionId?: string | null
}

export type ApartmentKind = 'rent' | 'water' | 'gas' | 'electricity'

export type ApartmentClaim = {
  id: string
  dateYmd?: string
  kind: ApartmentKind | string
  description?: string
  localAmount: number
  exchangeRate: number
  manualAud?: boolean
  rateFromAto?: boolean
  evidenceVersionId?: string | null
}

export type InterestEntry = {
  id: string
  bankAccountId?: string
  grossInterestAud: number
  tfnWithheldAud: number
}

export type DividendEntry = {
  id: string
  frankedAud: number
  unfrankedAud: number
  frankingCreditsAud: number
  tfnWithheldAud: number
}

export type RentalEntry = {
  id: string
  grossRentAud: number
  expensesAud: number
}

export type CapitalGainEntry = {
  id: string
  proceedsAud: number
  costBaseAud: number
  discountEligible: boolean
}

export type OtherInvestmentEntry = {
  id: string
  kind: string
  grossAud: number
  foreignTaxPaidAud: number
}

export type TaxYearRecord = {
  fyEndYear: number
  superannuationAud: number
  overseasDailyOverrideAud: number | null
  includeMedicareLevy: boolean
  monthlyIncome: MonthlyIncome[]
  monthAway: MonthAway[]
  otherClaims: WorkClaim[]
  flights: FlightClaim[]
  transport: TransportClaim[]
  carKm: CarKmClaim[]
  laundry: LaundryClaim[]
  apartmentCosts: ApartmentClaim[]
  interestByAccount: InterestEntry[]
  dividends: DividendEntry[]
  rentalProperties: RentalEntry[]
  capitalGains: CapitalGainEntry[]
  otherInvestments: OtherInvestmentEntry[]
  notes: string
}

export type TaxPlannerState = {
  schemaVersion: 2
  destinations: TaxDestination[]
  bankAccounts: BankAccount[]
  ratesByFy: Record<string, DestinationRate[]>
  years: TaxYearRecord[]
  activeFyEndYear: number
  overseasAtoSalaryTable: '6' | '7' | '8'
}

export type BracketRow = {
  from: number
  to: number | null
  rate: number
  taxAud: number
}

export type TaxYearSummary = {
  engineVersion: string
  fyEndYear: number
  fyLabel: string
  employmentIncomeAud: number
  interestIncomeAud: number
  dividendIncomeAud: number
  rentalIncomeAud: number
  capitalGainsAud: number
  otherInvestmentAud: number
  totalIncomeAud: number
  superannuationAud: number
  overseasDailyAud: number
  overseasDailyCalculatedAud: number
  otherClaimsAud: number
  flightsAud: number
  transportAud: number
  carKmAud: number
  carKmEntered: number
  carKmClaimable: number
  laundryAud: number
  apartmentCostsAud: number
  totalClaimsAud: number
  taxableIncomeAud: number
  frankingCreditsAud: number
  tfnWithheldAud: number
  foreignTaxOffsetAud: number
  taxOffsetsAud: number
  grossIncomeTaxAud: number
  incomeTaxAud: number
  medicareLevyAud: number
  estimatedTaxAud: number
  effectiveRate: number
  paygPerPay: number
  bracketRows: BracketRow[]
}

export type ClaimLineAud = {
  id: string
  kind: string
  amountAud: number
  dateYmd?: string
  description?: string
  currencyNote?: string
}

/** Line-level claim for Tax Summary drill-in and Expenses review (U11–U12). */
export type ClaimReviewLine = {
  id: string
  category: string
  dateYmd?: string
  description: string
  amountAud: number
  currencyNote?: string
  /** Optional sub-group within a category (e.g. Train / Bus / Taxi under Transport). */
  groupKey?: string
  groupLabel?: string
}
