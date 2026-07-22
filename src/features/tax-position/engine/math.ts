import { STAGE3_BRACKETS } from '@/features/tax-position/engine/constants'
import type { BracketRow } from '@/features/tax-position/engine/types'

/**
 * Foreign units per A$1. AUD = foreign ÷ rate. Never invert.
 */
export function foreignToAud(localAmount: number, exchangeRate: number): number {
  if (!(exchangeRate > 0)) return 0
  return localAmount / exchangeRate
}

export function claimAud(
  localAmount: number,
  exchangeRate: number,
  workPercentage: number,
  options?: { manualAud?: boolean; amountAud?: number },
): number {
  const base =
    options?.manualAud && typeof options.amountAud === 'number'
      ? options.amountAud
      : foreignToAud(localAmount, exchangeRate)
  return base * (workPercentage / 100)
}

export function stage3IncomeTax(taxableIncome: number): { tax: number; rows: BracketRow[] } {
  let remaining = Math.max(0, taxableIncome)
  let tax = 0
  const rows: BracketRow[] = []

  for (const bracket of STAGE3_BRACKETS) {
    const width = bracket.to === Infinity ? remaining : Math.max(0, bracket.to - bracket.from)
    const taxableInBracket = Math.min(remaining, width)
    const bracketTax = taxableInBracket * bracket.rate
    tax += bracketTax
    rows.push({
      from: bracket.from,
      to: bracket.to === Infinity ? null : bracket.to,
      rate: bracket.rate,
      taxAud: bracketTax,
    })
    remaining -= taxableInBracket
    if (remaining <= 0) break
  }

  return { tax, rows }
}
