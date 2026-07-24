import { describe, expect, it } from 'vitest'
import { summarizeFromPlanner } from '@/features/tax-position/engine'
import { buildCalculationTraces } from '@/features/tax-position/engine/traces'
import {
  fixtureAirlineInternational,
  fixtureSimpleEmployee,
} from './fixtures/tax-parity/builders'

/**
 * Provenance contract tests — written before traces implementation.
 * Every material figure must expose Source · Calculation · Result.
 */
describe('calculation traces (source · calculation · result)', () => {
  it('emits employment and tax traces for simple employee matching summary', () => {
    const state = fixtureSimpleEmployee()
    const summary = summarizeFromPlanner(state, 2026)!
    const traces = buildCalculationTraces(state, 2026)

    const employment = traces.find((t) => t.id === 'employment-income')
    expect(employment).toBeDefined()
    expect(employment!.source).toMatch(/monthly employment/i)
    expect(employment!.calculation).toMatch(/÷/)
    expect(employment!.resultAud).toBeCloseTo(summary.employmentIncomeAud, 6)

    const estimated = traces.find((t) => t.id === 'estimated-tax')
    expect(estimated).toBeDefined()
    expect(estimated!.resultAud).toBeCloseTo(summary.estimatedTaxAud, 6)
    expect(estimated!.engineVersion).toBe(summary.engineVersion)
  })

  it('traces FX claims and overseas daily for airline fixture', () => {
    const state = fixtureAirlineInternational()
    const summary = summarizeFromPlanner(state, 2026)!
    const traces = buildCalculationTraces(state, 2026)

    const flights = traces.find((t) => t.id === 'flights')
    expect(flights!.calculation).toMatch(/exchange rate/i)
    expect(flights!.resultAud).toBeCloseTo(summary.flightsAud, 6)
    expect(flights!.lines?.length).toBeGreaterThan(0)
    expect(flights!.lines![0]).toMatchObject({
      category: 'flight',
      amountAud: expect.any(Number),
      description: expect.any(String),
    })

    const overseas = traces.find((t) => t.id === 'overseas-daily')
    expect(overseas!.source).toMatch(/overnight planner nights/i)
    expect(overseas!.resultAud).toBeCloseTo(summary.overseasDailyAud, 6)

    const carKm = traces.find((t) => t.id === 'car-km')
    expect(carKm!.calculation).toMatch(/5,?000|FIFO|cap/i)
    expect(carKm!.resultAud).toBeCloseTo(summary.carKmAud, 6)
  })

  it('includes date and description on flight claim review lines', () => {
    const state = fixtureAirlineInternational()
    const year = state.years[0]!
    year.flights = [
      {
        id: 'flight-review',
        dateYmd: '2020-04-21',
        description: 'BNE-SYD for US Visa interview',
        currencyCode: 'AUD',
        localAmount: 320,
        exchangeRate: 1,
        workPercentage: 100,
      },
    ]
    const traces = buildCalculationTraces(state, 2026)
    const flights = traces.find((t) => t.id === 'flights')
    expect(flights!.lines).toEqual([
      expect.objectContaining({
        id: 'flight-review',
        dateYmd: '2020-04-21',
        description: 'BNE-SYD for US Visa interview',
        amountAud: 320,
      }),
    ])
  })

  it('marks foreign claims pending when FX rate is missing', () => {
    const state = fixtureAirlineInternational()
    const year = state.years[0]!
    year.apartmentCosts = [
      {
        id: 'rent-pending',
        dateYmd: '2026-07-21',
        kind: 'rent',
        description: 'JULY Rent',
        localAmount: 285000,
        exchangeRate: 0,
      },
    ]
    year.flights = [
      {
        id: 'flight-pending',
        dateYmd: '2026-07-18',
        description: 'Tokyo hop',
        currencyCode: 'JPY',
        localAmount: 50000,
        exchangeRate: 0,
        workPercentage: 100,
      },
    ]

    const traces = buildCalculationTraces(state, 2026)
    const apartment = traces.find((t) => t.id === 'apartment')
    expect(apartment!.resultAud).toBe(0)
    expect(apartment!.lines).toEqual([
      expect.objectContaining({
        id: 'rent-pending',
        amountAud: 0,
        pendingAud: true,
        currencyNote: 'JPY 285000 · Pending ATO rate',
      }),
    ])

    const flights = traces.find((t) => t.id === 'flights')
    expect(flights!.lines?.[0]).toMatchObject({
      id: 'flight-pending',
      pendingAud: true,
      currencyNote: 'JPY 50000 · Pending ATO rate',
    })
  })

  it('every trace has source, calculation, and numeric result', () => {
    const traces = buildCalculationTraces(fixtureAirlineInternational(), 2026)
    expect(traces.length).toBeGreaterThan(5)
    for (const t of traces) {
      expect(t.source.length).toBeGreaterThan(0)
      expect(t.calculation.length).toBeGreaterThan(0)
      expect(Number.isFinite(t.resultAud)).toBe(true)
      expect(t.engineVersion).toBeTruthy()
    }
  })
})
