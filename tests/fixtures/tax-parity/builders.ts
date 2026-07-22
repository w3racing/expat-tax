import type { TaxPlannerState, TaxYearRecord } from '@/features/tax-position/engine/types'
import { emptyTaxYear } from '@/features/tax-position/engine/summarize'

function monthsUsd(
  count: number,
  startKey: string,
  fifth: number,
  twentieth: number,
  rate: number,
): TaxYearRecord['monthlyIncome'] {
  const [y, m] = startKey.split('-').map(Number)
  const rows = []
  for (let i = 0; i < count; i++) {
    let month = m + i
    let year = y
    while (month > 12) {
      month -= 12
      year += 1
    }
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    rows.push({
      id: `inc-${monthKey}`,
      monthKey,
      incomeUsd5th: fifth,
      incomeUsd20th: twentieth,
      incomeUsd: fifth + twentieth,
      usdAudRate: rate,
      usdAudFromAto: false,
    })
  }
  return rows
}

function baseState(year: TaxYearRecord, extras?: Partial<TaxPlannerState>): TaxPlannerState {
  return {
    schemaVersion: 2,
    destinations: extras?.destinations ?? [],
    bankAccounts: extras?.bankAccounts ?? [],
    ratesByFy: extras?.ratesByFy ?? {},
    years: [year],
    activeFyEndYear: year.fyEndYear,
    overseasAtoSalaryTable: '7',
  }
}

export function fixtureSimpleEmployee(): TaxPlannerState {
  const year = emptyTaxYear(2026)
  year.monthlyIncome = monthsUsd(12, '2025-07', 5000, 5000, 0.65)
  return baseState(year)
}

export function fixtureAirlineInternational(): TaxPlannerState {
  const year = emptyTaxYear(2026)
  year.monthlyIncome = monthsUsd(10, '2025-07', 5000, 5000, 0.65)
  year.superannuationAud = 3000
  year.monthAway = [
    { id: 'away-jp', monthKey: '2025-09', destinationId: 'dest-japan', nights: 40 },
    { id: 'away-th', monthKey: '2025-11', destinationId: 'dest-thailand', nights: 10 },
  ]
  year.otherClaims = [
    {
      id: 'work-1',
      currencyCode: 'AUD',
      localAmount: 220,
      exchangeRate: 1,
      amountAud: 220,
      workPercentage: 80,
      rateFromAto: false,
    },
  ]
  year.flights = [
    {
      id: 'flight-1',
      currencyCode: 'USD',
      localAmount: 800,
      exchangeRate: 0.66,
      workPercentage: 100,
      rateFromAto: false,
    },
  ]
  year.transport = [
    {
      id: 'tr-1',
      currencyCode: 'JPY',
      localAmount: 5000,
      exchangeRate: 97.5,
      workPercentage: 100,
      rateFromAto: false,
    },
  ]
  year.carKm = [{ id: 'km-1', kilometres: 1200, centsPerKm: 88 }]
  year.laundry = [{ id: 'la-1', localAmount: 15000, exchangeRate: 97.5, rateFromAto: false }]
  year.apartmentCosts = [
    { id: 'ap-1', kind: 'rent', localAmount: 180000, exchangeRate: 97, rateFromAto: false },
  ]
  return baseState(year, {
    destinations: [
      { id: 'dest-japan', name: 'Japan', sortOrder: 0 },
      { id: 'dest-thailand', name: 'Thailand', sortOrder: 1 },
    ],
    ratesByFy: {
      '2026': [
        { destinationId: 'dest-japan', dailyRateAud: 185 },
        { destinationId: 'dest-thailand', dailyRateAud: 140 },
      ],
    },
  })
}

export function fixtureForeignIncome(): TaxPlannerState {
  const year = emptyTaxYear(2026)
  year.monthlyIncome = monthsUsd(6, '2025-07', 8000, 8000, 0.64)
  year.otherInvestments = [
    { id: 'oi-1', kind: 'foreign', grossAud: 2500, foreignTaxPaidAud: 400 },
  ]
  return baseState(year)
}

export function fixtureForeignExpenses(): TaxPlannerState {
  const year = emptyTaxYear(2026)
  year.interestByAccount = [
    { id: 'int-1', grossInterestAud: 1200, tfnWithheldAud: 50 },
  ]
  year.otherClaims = [
    {
      id: 'w-jpy',
      currencyCode: 'JPY',
      localAmount: 25000,
      exchangeRate: 98,
      workPercentage: 100,
      rateFromAto: false,
    },
    {
      id: 'w-usd',
      currencyCode: 'USD',
      localAmount: 150,
      exchangeRate: 0.67,
      workPercentage: 50,
      rateFromAto: false,
    },
  ]
  year.laundry = [
    { id: 'l1', localAmount: 10000, exchangeRate: 98, rateFromAto: false },
    { id: 'l2', localAmount: 10000, exchangeRate: 98, rateFromAto: false },
    { id: 'l3', localAmount: 10000, exchangeRate: 98, rateFromAto: false },
  ]
  return baseState(year)
}

export function fixtureTravelDeductions(): TaxPlannerState {
  const year = emptyTaxYear(2026)
  year.monthlyIncome = monthsUsd(12, '2025-07', 3000, 3000, 0.7)
  year.overseasDailyOverrideAud = 4800
  year.monthAway = [{ id: 'away-x', monthKey: '2025-10', destinationId: 'dest-x', nights: 25 }]
  return baseState(year, {
    destinations: [{ id: 'dest-x', name: 'Destination X', sortOrder: 0 }],
    ratesByFy: { '2026': [{ destinationId: 'dest-x', dailyRateAud: 200 }] },
  })
}

export function fixtureInvestmentIncome(): TaxPlannerState {
  const year = emptyTaxYear(2026)
  year.interestByAccount = [{ id: 'i1', grossInterestAud: 800, tfnWithheldAud: 100 }]
  year.dividends = [
    {
      id: 'd1',
      frankedAud: 700,
      unfrankedAud: 200,
      frankingCreditsAud: 300,
      tfnWithheldAud: 20,
    },
  ]
  year.rentalProperties = [{ id: 'r1', grossRentAud: 24000, expensesAud: 9000 }]
  year.capitalGains = [
    { id: 'c1', proceedsAud: 50000, costBaseAud: 30000, discountEligible: true },
  ]
  year.otherInvestments = [{ id: 'o1', kind: 'foreign', grossAud: 1500, foreignTaxPaidAud: 100 }]
  return baseState(year)
}

export function fixtureMixedCurrencies(): TaxPlannerState {
  const year = emptyTaxYear(2026)
  year.monthlyIncome = monthsUsd(12, '2025-07', 4500, 4500, 0.66)
  year.superannuationAud = 5000
  year.monthAway = [{ id: 'away-m', monthKey: '2025-08', destinationId: 'dest-m', nights: 15 }]
  year.otherClaims = [
    {
      id: 'aud',
      currencyCode: 'AUD',
      localAmount: 100,
      exchangeRate: 1,
      workPercentage: 100,
      rateFromAto: false,
    },
    {
      id: 'jpy',
      currencyCode: 'JPY',
      localAmount: 12000,
      exchangeRate: 96.5,
      workPercentage: 100,
      rateFromAto: false,
    },
    {
      id: 'usd',
      currencyCode: 'USD',
      localAmount: 80,
      exchangeRate: 0.66,
      workPercentage: 100,
      rateFromAto: false,
    },
    {
      id: 'eur',
      currencyCode: 'EUR',
      localAmount: 50,
      exchangeRate: 0.61,
      workPercentage: 100,
      rateFromAto: false,
    },
  ]
  year.flights = [
    {
      id: 'f1',
      currencyCode: 'USD',
      localAmount: 450,
      exchangeRate: 0.66,
      workPercentage: 100,
      rateFromAto: false,
    },
  ]
  year.transport = [
    {
      id: 't1',
      currencyCode: 'JPY',
      localAmount: 3000,
      exchangeRate: 96.5,
      workPercentage: 100,
      rateFromAto: false,
    },
  ]
  year.laundry = [{ id: 'la', localAmount: 8000, exchangeRate: 96.5, rateFromAto: false }]
  year.apartmentCosts = [
    { id: 'ap', kind: 'rent', localAmount: 95000, exchangeRate: 96.5, rateFromAto: false },
  ]
  year.carKm = [
    { id: 'km1', kilometres: 3000, centsPerKm: 88 },
    { id: 'km2', kilometres: 2500, centsPerKm: 88 },
  ]
  return baseState(year, {
    destinations: [{ id: 'dest-m', name: 'Mixed', sortOrder: 0 }],
    ratesByFy: { '2026': [{ destinationId: 'dest-m', dailyRateAud: 190 }] },
  })
}
