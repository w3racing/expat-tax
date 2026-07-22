/** Pinned engine version for calculator parity (ADR-021 / parity spec). */
export const ENGINE_VERSION = 'calculator-parity-2026.1'

export const MEDICARE_LEVY_RATE = 0.02
export const PAY_PERIODS_PER_YEAR = 24
export const CAR_KM_ANNUAL_MAX = 5000
export const DEFAULT_CENTS_PER_KM_FY2026 = 88

/** Stage 3 resident brackets (FY 2025–26 / fyEndYear 2026). */
export const STAGE3_BRACKETS = [
  { from: 0, to: 18_200, rate: 0 },
  { from: 18_200, to: 45_000, rate: 0.16 },
  { from: 45_000, to: 135_000, rate: 0.3 },
  { from: 135_000, to: 190_000, rate: 0.37 },
  { from: 190_000, to: Infinity, rate: 0.45 },
] as const
