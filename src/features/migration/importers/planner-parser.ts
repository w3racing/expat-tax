import { z } from 'zod'
import type { TaxPlannerState } from '@/features/tax-position/engine'

const monthlyIncomeSchema = z.object({
  id: z.string(),
  monthKey: z.string(),
  incomeUsd5th: z.number().optional().default(0),
  incomeUsd20th: z.number().optional().default(0),
  incomeUsd: z.number().optional().default(0),
  usdAudRate: z.number().optional().default(0),
  usdAudFromAto: z.boolean().optional(),
})

const yearSchema = z
  .object({
    fyEndYear: z.number(),
    superannuationAud: z.number().optional().default(0),
    overseasDailyOverrideAud: z.number().nullable().optional().default(null),
    includeMedicareLevy: z.boolean().optional().default(true),
    monthlyIncome: z.array(monthlyIncomeSchema).optional().default([]),
    monthAway: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    otherClaims: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    flights: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    transport: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    carKm: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    laundry: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    apartmentCosts: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    interestByAccount: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    dividends: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    rentalProperties: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    capitalGains: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    otherInvestments: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    notes: z.string().optional().default(''),
    receiptFolders: z.array(z.unknown()).optional(),
  })
  .passthrough()

export const taxPlannerStateSchema = z.object({
  schemaVersion: z.literal(2),
  destinations: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  bankAccounts: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  ratesByFy: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))).optional().default({}),
  years: z.array(yearSchema).min(1),
  activeFyEndYear: z.number(),
  overseasAtoSalaryTable: z.enum(['6', '7', '8']).optional().default('7'),
})

export function isTaxPlannerState(value: unknown): boolean {
  const result = taxPlannerStateSchema.safeParse(value)
  return result.success
}

export function parseTaxPlannerState(input: string): TaxPlannerState {
  const json: unknown = JSON.parse(input)
  if (json && typeof json === 'object' && 'app' in json) {
    throw Object.assign(new Error('Full app backup not supported'), { code: 'IMPORT_UNSUPPORTED' })
  }
  const parsed = taxPlannerStateSchema.parse(json)
  return normalizePlanner(parsed)
}

function normalizePlanner(raw: z.infer<typeof taxPlannerStateSchema>): TaxPlannerState {
  return {
    schemaVersion: 2,
    destinations: (raw.destinations as TaxPlannerState['destinations']).map((d, i) => ({
      id: String((d as { id?: string }).id ?? `dest-${i}`),
      name: String((d as { name?: string }).name ?? 'Destination'),
      sortOrder: Number((d as { sortOrder?: number }).sortOrder ?? i),
    })),
    bankAccounts: (raw.bankAccounts as TaxPlannerState['bankAccounts']).map((b, i) => ({
      id: String((b as { id?: string }).id ?? `bank-${i}`),
      label: String((b as { label?: string }).label ?? 'Account'),
      institution: (b as { institution?: string }).institution,
      sortOrder: Number((b as { sortOrder?: number }).sortOrder ?? i),
    })),
    ratesByFy: Object.fromEntries(
      Object.entries(raw.ratesByFy).map(([fy, rows]) => [
        fy,
        rows.map((r) => ({
          destinationId: String((r as { destinationId?: string }).destinationId ?? ''),
          dailyRateAud: Number((r as { dailyRateAud?: number }).dailyRateAud ?? 0),
        })),
      ]),
    ),
    activeFyEndYear: raw.activeFyEndYear,
    overseasAtoSalaryTable: raw.overseasAtoSalaryTable,
    years: raw.years.map((y) => normalizeYear(y)),
  }
}

function normalizeYear(y: z.infer<typeof yearSchema>): TaxPlannerState['years'][number] {
  return {
    fyEndYear: y.fyEndYear,
    superannuationAud: y.superannuationAud,
    overseasDailyOverrideAud: y.overseasDailyOverrideAud,
    includeMedicareLevy: y.includeMedicareLevy,
    notes: y.notes,
    monthlyIncome: y.monthlyIncome.map((m) => ({
      id: m.id,
      monthKey: m.monthKey,
      incomeUsd5th: m.incomeUsd5th,
      incomeUsd20th: m.incomeUsd20th,
      incomeUsd: m.incomeUsd || m.incomeUsd5th + m.incomeUsd20th,
      usdAudRate: m.usdAudRate,
      usdAudFromAto: m.usdAudFromAto,
    })),
    monthAway: y.monthAway.map((r, i) => ({
      id: String((r as { id?: string }).id ?? `away-${i}`),
      monthKey: String((r as { monthKey?: string }).monthKey ?? ''),
      destinationId: String((r as { destinationId?: string }).destinationId ?? ''),
      nights: Number((r as { nights?: number }).nights ?? 0),
    })),
    otherClaims: y.otherClaims.map((r, i) => mapFxClaim(r, i, 'work')),
    flights: y.flights.map((r, i) => mapFxClaim(r, i, 'flight')),
    transport: y.transport.map((r, i) => ({
      ...mapFxClaim(r, i, 'transport'),
      audAmount: (r as { audAmount?: number }).audAmount,
    })),
    carKm: y.carKm.map((r, i) => ({
      id: String((r as { id?: string }).id ?? `km-${i}`),
      dateYmd: pickDateYmd(r as Record<string, unknown>),
      kilometres: Number((r as { kilometres?: number }).kilometres ?? 0),
      centsPerKm: Number((r as { centsPerKm?: number }).centsPerKm ?? 88),
      description: pickDescription(r as Record<string, unknown>),
    })),
    laundry: y.laundry.map((r, i) => ({
      id: String((r as { id?: string }).id ?? `la-${i}`),
      dateYmd: pickDateYmd(r as Record<string, unknown>),
      description: pickDescription(r as Record<string, unknown>),
      localAmount: Number((r as { localAmount?: number }).localAmount ?? 0),
      exchangeRate: Number((r as { exchangeRate?: number }).exchangeRate ?? 0),
      rateFromAto: (r as { rateFromAto?: boolean }).rateFromAto,
    })),
    apartmentCosts: y.apartmentCosts.map((r, i) => ({
      id: String((r as { id?: string }).id ?? `ap-${i}`),
      dateYmd: pickDateYmd(r as Record<string, unknown>),
      kind: String((r as { kind?: string }).kind ?? 'rent'),
      description: pickDescription(r as Record<string, unknown>),
      localAmount: Number((r as { localAmount?: number }).localAmount ?? 0),
      exchangeRate: Number((r as { exchangeRate?: number }).exchangeRate ?? 0),
      rateFromAto: (r as { rateFromAto?: boolean }).rateFromAto,
    })),
    interestByAccount: y.interestByAccount.map((r, i) => ({
      id: String((r as { id?: string }).id ?? `int-${i}`),
      bankAccountId: (r as { bankAccountId?: string }).bankAccountId,
      grossInterestAud: Number((r as { grossInterestAud?: number }).grossInterestAud ?? 0),
      tfnWithheldAud: Number((r as { tfnWithheldAud?: number }).tfnWithheldAud ?? 0),
    })),
    dividends: y.dividends.map((r, i) => ({
      id: String((r as { id?: string }).id ?? `div-${i}`),
      frankedAud: Number((r as { frankedAud?: number }).frankedAud ?? 0),
      unfrankedAud: Number((r as { unfrankedAud?: number }).unfrankedAud ?? 0),
      frankingCreditsAud: Number((r as { frankingCreditsAud?: number }).frankingCreditsAud ?? 0),
      tfnWithheldAud: Number((r as { tfnWithheldAud?: number }).tfnWithheldAud ?? 0),
    })),
    rentalProperties: y.rentalProperties.map((r, i) => ({
      id: String((r as { id?: string }).id ?? `rent-${i}`),
      grossRentAud: Number((r as { grossRentAud?: number }).grossRentAud ?? 0),
      expensesAud: Number((r as { expensesAud?: number }).expensesAud ?? 0),
    })),
    capitalGains: y.capitalGains.map((r, i) => ({
      id: String((r as { id?: string }).id ?? `cgt-${i}`),
      proceedsAud: Number((r as { proceedsAud?: number }).proceedsAud ?? 0),
      costBaseAud: Number((r as { costBaseAud?: number }).costBaseAud ?? 0),
      discountEligible: Boolean((r as { discountEligible?: boolean }).discountEligible),
    })),
    otherInvestments: y.otherInvestments.map((r, i) => ({
      id: String((r as { id?: string }).id ?? `oi-${i}`),
      kind: String((r as { kind?: string }).kind ?? 'other'),
      grossAud: Number((r as { grossAud?: number }).grossAud ?? 0),
      foreignTaxPaidAud: Number((r as { foreignTaxPaidAud?: number }).foreignTaxPaidAud ?? 0),
    })),
  }
}

function pickDateYmd(r: Record<string, unknown>): string | undefined {
  const raw = r.dateYmd ?? r.date_ymd ?? r.date
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed || undefined
}

function pickDescription(r: Record<string, unknown>): string | undefined {
  const raw = r.description ?? r.item ?? r.label
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed || undefined
}

function mapFxClaim(r: Record<string, unknown>, i: number, prefix: string) {
  return {
    id: String(r.id ?? `${prefix}-${i}`),
    dateYmd: pickDateYmd(r),
    description: pickDescription(r),
    currencyCode: String(r.currencyCode ?? 'AUD'),
    localAmount: Number(r.localAmount ?? 0),
    exchangeRate: Number(r.exchangeRate ?? 1),
    amountAud: r.amountAud as number | undefined,
    workPercentage: Number(r.workPercentage ?? 100),
    manualAud: r.manualAud as boolean | undefined,
    rateFromAto: r.rateFromAto as boolean | undefined,
  }
}
