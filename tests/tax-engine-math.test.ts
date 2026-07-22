import { describe, expect, it } from 'vitest'
import { claimAud, foreignToAud, stage3IncomeTax } from '@/features/tax-position/engine/math'
import { ENGINE_VERSION } from '@/features/tax-position/engine/constants'
import { summarizeFromPlanner } from '@/features/tax-position/engine'
import { fixtureSimpleEmployee } from './fixtures/tax-parity/builders'

/**
 * L0 unit tests — pin Calculator-compatible helpers BEFORE any engine edits.
 * Do not change these expectations without a new engine_version.
 */
describe('tax-engine-math (calculator parity helpers)', () => {
  it('foreignToAud divides by units per A$1 and never inverts', () => {
    expect(foreignToAud(10000, 0.65)).toBeCloseTo(15384.615384615385, 10)
    expect(foreignToAud(5000, 97.5)).toBeCloseTo(51.28205128205128, 10)
    expect(foreignToAud(100, 0)).toBe(0)
    expect(foreignToAud(100, -1)).toBe(0)
  })

  it('claimAud applies work percentage after FX', () => {
    expect(claimAud(220, 1, 80)).toBeCloseTo(176, 10)
    expect(claimAud(150, 0.67, 50)).toBeCloseTo(111.940298507463, 10)
  })

  it('claimAud respects manual AUD when flagged', () => {
    expect(claimAud(999, 0.5, 100, { manualAud: true, amountAud: 40 })).toBe(40)
  })

  it('stage3IncomeTax matches Stage 3 resident brackets for known taxable', () => {
    const { tax } = stage3IncomeTax(184615.38461538462)
    expect(tax).toBeCloseTo(49645.69230769231, 6)
  })

  it('pins engine version for summary outputs', () => {
    const summary = summarizeFromPlanner(fixtureSimpleEmployee(), 2026)!
    expect(summary.engineVersion).toBe(ENGINE_VERSION)
    expect(ENGINE_VERSION).toBe('calculator-parity-2026.1')
  })
})
