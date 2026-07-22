/** Parse and validate overnight night counts while typing. */

/** Soft upper bound — Calculator allows dense monthly patterns (e.g. 40+). */
export const MAX_NIGHTS_PER_CELL = 99

export type NightsParseResult =
  | { ok: true; nights: number; display: string }
  | { ok: false; nights: null; display: string; error: string }

/**
 * Accept empty (0), digits only. Reject decimals, negatives, and values above max.
 * `display` is what the input should show (strip leading zeros except empty/"0").
 */
export function parseNightsInput(raw: string): NightsParseResult {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return { ok: true, nights: 0, display: '' }
  }

  if (!/^\d+$/.test(trimmed)) {
    return {
      ok: false,
      nights: null,
      display: raw,
      error: 'Enter a whole number of nights',
    }
  }

  const nights = Number(trimmed)
  if (!Number.isFinite(nights)) {
    return {
      ok: false,
      nights: null,
      display: raw,
      error: 'Enter a whole number of nights',
    }
  }

  if (nights > MAX_NIGHTS_PER_CELL) {
    return {
      ok: false,
      nights: null,
      display: trimmed,
      error: `Max ${MAX_NIGHTS_PER_CELL} nights per cell`,
    }
  }

  // Normalise leading zeros for display once committed; while typing keep trimmed digits
  const display = trimmed.replace(/^0+(?=\d)/, '')
  return { ok: true, nights, display: display === '' ? '0' : display }
}

export type RateParseResult =
  | { ok: true; rate: number; display: string }
  | { ok: false; rate: null; display: string; error: string }

export function parseDailyRateInput(raw: string): RateParseResult {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return { ok: true, rate: 0, display: '' }
  }

  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) {
    return {
      ok: false,
      rate: null,
      display: raw,
      error: 'Enter a valid daily rate in AUD',
    }
  }

  const rate = Number(trimmed)
  if (!Number.isFinite(rate) || rate < 0) {
    return {
      ok: false,
      rate: null,
      display: raw,
      error: 'Enter a valid daily rate in AUD',
    }
  }

  if (rate > 10_000) {
    return {
      ok: false,
      rate: null,
      display: trimmed,
      error: 'Daily rate looks too high',
    }
  }

  return { ok: true, rate, display: trimmed }
}
