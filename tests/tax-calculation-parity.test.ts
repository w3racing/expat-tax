import { describe, expect, it } from 'vitest'
import { summarizeFromPlanner } from '@/features/tax-position/engine'
import {
  fixtureAirlineInternational,
  fixtureForeignExpenses,
  fixtureForeignIncome,
  fixtureInvestmentIncome,
  fixtureMixedCurrencies,
  fixtureSimpleEmployee,
  fixtureTravelDeductions,
} from './fixtures/tax-parity/builders'

const MONEY = 0.005

function expectMoney(actual: number, expected: number, label: string) {
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(MONEY)
}

describe('tax-calculation-parity', () => {
  it('parity-simple-employee', () => {
    const summary = summarizeFromPlanner(fixtureSimpleEmployee(), 2026)!
    expectMoney(summary.employmentIncomeAud, 184615.38461538462, 'employment')
    expectMoney(summary.totalClaimsAud, 0, 'claims')
    expectMoney(summary.taxableIncomeAud, 184615.38461538462, 'taxable')
    expectMoney(summary.grossIncomeTaxAud, 49645.69230769231, 'gross tax')
    expectMoney(summary.medicareLevyAud, 3692.307692307692, 'medicare')
    expectMoney(summary.estimatedTaxAud, 53338, 'estimated')
    expectMoney(summary.paygPerPay, 2222.416666666667, 'payg')
  })

  it('parity-airline-international', () => {
    const summary = summarizeFromPlanner(fixtureAirlineInternational(), 2026)!
    expectMoney(summary.employmentIncomeAud, 153846.15384615384, 'employment')
    expectMoney(summary.overseasDailyAud, 8800, 'overseas')
    expectMoney(summary.otherClaimsAud, 176, 'other')
    expectMoney(summary.flightsAud, 1212.121212121212, 'flights')
    expectMoney(summary.transportAud, 51.28205128205128, 'transport')
    expectMoney(summary.carKmAud, 1056, 'carKm')
    expect(summary.carKmEntered).toBe(1200)
    expectMoney(summary.laundryAud, 153.84615384615385, 'laundry')
    expectMoney(summary.apartmentCostsAud, 1855.6701030927836, 'apartment')
    expectMoney(summary.totalClaimsAud, 16304.919520346345, 'total claims')
    expectMoney(summary.taxableIncomeAud, 137541.2343258075, 'taxable')
    expectMoney(summary.grossIncomeTaxAud, 32228.25670174225, 'gross')
    expectMoney(summary.medicareLevyAud, 2750.82468651615, 'medicare')
    expectMoney(summary.estimatedTaxAud, 34979.0813882584, 'estimated')
    expectMoney(summary.paygPerPay, 1457.4617245107667, 'payg')
  })

  it('parity-foreign-income', () => {
    const summary = summarizeFromPlanner(fixtureForeignIncome(), 2026)!
    expectMoney(summary.employmentIncomeAud, 150000, 'employment')
    expectMoney(summary.otherInvestmentAud, 2500, 'other inv')
    expectMoney(summary.taxableIncomeAud, 152500, 'taxable')
    expectMoney(summary.foreignTaxOffsetAud, 400, 'fx offset')
    expectMoney(summary.grossIncomeTaxAud, 37763, 'gross')
    expectMoney(summary.incomeTaxAud, 37363, 'income tax')
    expectMoney(summary.medicareLevyAud, 3050, 'medicare')
    expectMoney(summary.estimatedTaxAud, 40413, 'estimated')
    expectMoney(summary.paygPerPay, 1683.875, 'payg')
  })

  it('parity-foreign-expenses', () => {
    const summary = summarizeFromPlanner(fixtureForeignExpenses(), 2026)!
    expectMoney(summary.interestIncomeAud, 1200, 'interest')
    expectMoney(summary.otherClaimsAud, 367.0423393237892, 'other')
    expectMoney(summary.laundryAud, 306.1224489795919, 'laundry')
    expectMoney(summary.totalClaimsAud, 673.1647883033811, 'claims')
    expectMoney(summary.taxableIncomeAud, 526.8352116966189, 'taxable')
    expectMoney(summary.tfnWithheldAud, 50, 'tfn')
    expectMoney(summary.grossIncomeTaxAud, 0, 'gross')
    expectMoney(summary.incomeTaxAud, 0, 'income tax')
    expectMoney(summary.medicareLevyAud, 10.536704233932378, 'medicare')
    expectMoney(summary.estimatedTaxAud, 10.536704233932378, 'estimated')
    expectMoney(summary.paygPerPay, 0.43902934308051575, 'payg')
  })

  it('parity-travel-deductions', () => {
    const summary = summarizeFromPlanner(fixtureTravelDeductions(), 2026)!
    expectMoney(summary.employmentIncomeAud, 102857.14285714286, 'employment')
    expectMoney(summary.overseasDailyCalculatedAud, 5000, 'calculated')
    expectMoney(summary.overseasDailyAud, 4800, 'override')
    expectMoney(summary.totalClaimsAud, 4800, 'claims')
    expectMoney(summary.taxableIncomeAud, 98057.14285714286, 'taxable')
    expectMoney(summary.grossIncomeTaxAud, 20205.142857142855, 'gross')
    expectMoney(summary.medicareLevyAud, 1961.142857142857, 'medicare')
    expectMoney(summary.estimatedTaxAud, 22166.28571428571, 'estimated')
    expectMoney(summary.paygPerPay, 923.595238095238, 'payg')
  })

  it('parity-investment-income', () => {
    const summary = summarizeFromPlanner(fixtureInvestmentIncome(), 2026)!
    expectMoney(summary.interestIncomeAud, 800, 'interest')
    expectMoney(summary.dividendIncomeAud, 1200, 'div')
    expectMoney(summary.rentalIncomeAud, 15000, 'rental')
    expectMoney(summary.capitalGainsAud, 10000, 'cgt')
    expectMoney(summary.otherInvestmentAud, 1500, 'other')
    expectMoney(summary.taxableIncomeAud, 28500, 'taxable')
    expectMoney(summary.frankingCreditsAud, 300, 'franking')
    expectMoney(summary.tfnWithheldAud, 120, 'tfn')
    expectMoney(summary.foreignTaxOffsetAud, 100, 'foreign')
    expectMoney(summary.taxOffsetsAud, 520, 'offsets')
    expectMoney(summary.grossIncomeTaxAud, 1648, 'gross')
    expectMoney(summary.incomeTaxAud, 1128, 'income tax')
    expectMoney(summary.medicareLevyAud, 570, 'medicare')
    expectMoney(summary.estimatedTaxAud, 1698, 'estimated')
    expectMoney(summary.paygPerPay, 70.75, 'payg')
  })

  it('parity-mixed-currencies', () => {
    const summary = summarizeFromPlanner(fixtureMixedCurrencies(), 2026)!
    expectMoney(summary.employmentIncomeAud, 163636.36363636365, 'employment')
    expectMoney(summary.overseasDailyAud, 2850, 'overseas')
    expectMoney(summary.otherClaimsAud, 427.5316659330929, 'other')
    expectMoney(summary.flightsAud, 681.8181818181819, 'flights')
    expectMoney(summary.transportAud, 31.088082901554404, 'transport')
    expectMoney(summary.carKmAud, 4400, 'carKm')
    expect(summary.carKmEntered).toBe(5500)
    expect(summary.carKmClaimable).toBe(5000)
    expectMoney(summary.laundryAud, 82.90155440414508, 'laundry')
    expectMoney(summary.apartmentCostsAud, 984.4559585492228, 'apartment')
    expectMoney(summary.totalClaimsAud, 14457.795443606196, 'claims')
    expectMoney(summary.taxableIncomeAud, 149178.56819275744, 'taxable')
    expectMoney(summary.grossIncomeTaxAud, 36534.07023132725, 'gross')
    expectMoney(summary.medicareLevyAud, 2983.571363855149, 'medicare')
    expectMoney(summary.estimatedTaxAud, 39517.6415951824, 'estimated')
    expectMoney(summary.paygPerPay, 1646.5683997992666, 'payg')
  })
})
