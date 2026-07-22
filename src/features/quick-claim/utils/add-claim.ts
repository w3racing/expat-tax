import {
  CAR_KM_ANNUAL_MAX,
  DEFAULT_CENTS_PER_KM_FY2026,
} from '@/features/tax-position/engine/constants'
import type { TaxYearRecord } from '@/features/tax-position/engine/types'
import type { ClaimFormConfig } from '@/features/quick-claim/config/claim-catalog'
import { resolveFxForClaim } from '@/features/quick-claim/utils/resolve-fx'

export type AmountClaimInput = {
  dateYmd: string
  description: string
  currencyCode: string
  localAmount: number
  /** Optional override when ATO rate missing or user edits FX */
  exchangeRate?: number
  rateFromAto?: boolean
  evidenceVersionId?: string | null
}

export type CarKmClaimInput = {
  dateYmd: string
  description: string
  kilometres: number
  evidenceVersionId?: string | null
}

export function carKmRemaining(year: TaxYearRecord): number {
  const entered = year.carKm.reduce((s, c) => s + c.kilometres, 0)
  return Math.max(0, CAR_KM_ANNUAL_MAX - entered)
}

export function carKmClaimableForEntry(year: TaxYearRecord, kilometres: number): {
  claimableKm: number
  amountAud: number
  centsPerKm: number
  remainingBefore: number
} {
  const remainingBefore = carKmRemaining(year)
  const claimableKm = Math.min(Math.max(0, kilometres), remainingBefore)
  const centsPerKm = DEFAULT_CENTS_PER_KM_FY2026
  return {
    claimableKm,
    amountAud: (claimableKm * centsPerKm) / 100,
    centsPerKm,
    remainingBefore,
  }
}

export function appendClaimFromForm(
  year: TaxYearRecord,
  config: ClaimFormConfig,
  input: AmountClaimInput | CarKmClaimInput,
  claimId = crypto.randomUUID(),
): { year: TaxYearRecord; claimId: string } {
  const id = claimId

  if (config.mode === 'car-km') {
    const car = input as CarKmClaimInput
    const next: TaxYearRecord = {
      ...year,
      carKm: [
        ...year.carKm,
        {
          id,
          dateYmd: car.dateYmd,
          description: car.description.trim() || config.defaultDescription,
          kilometres: Math.max(0, car.kilometres),
          centsPerKm: DEFAULT_CENTS_PER_KM_FY2026,
          evidenceVersionId: car.evidenceVersionId ?? null,
        },
      ],
    }
    return { year: next, claimId: id }
  }

  const amount = input as AmountClaimInput
  const fx =
    typeof amount.exchangeRate === 'number'
      ? {
          exchangeRate: amount.exchangeRate,
          rateFromAto: Boolean(amount.rateFromAto),
        }
      : resolveFxForClaim(amount.currencyCode, amount.dateYmd)

  if (config.ledger === 'flights') {
    return {
      claimId: id,
      year: {
        ...year,
        flights: [
          ...year.flights,
          {
            id,
            dateYmd: amount.dateYmd,
            description: amount.description.trim() || config.defaultDescription,
            currencyCode: amount.currencyCode,
            localAmount: amount.localAmount,
            exchangeRate: fx.exchangeRate,
            workPercentage: 100,
            rateFromAto: fx.rateFromAto,
            evidenceVersionId: amount.evidenceVersionId ?? null,
          },
        ],
      },
    }
  }

  if (config.ledger === 'transport') {
    return {
      claimId: id,
      year: {
        ...year,
        transport: [
          ...year.transport,
          {
            id,
            dateYmd: amount.dateYmd,
            description: amount.description.trim() || config.defaultDescription,
            kind: config.transportKind,
            currencyCode: amount.currencyCode,
            localAmount: amount.localAmount,
            exchangeRate: fx.exchangeRate,
            workPercentage: 100,
            rateFromAto: fx.rateFromAto,
            evidenceVersionId: amount.evidenceVersionId ?? null,
          },
        ],
      },
    }
  }

  if (config.ledger === 'apartmentCosts') {
    return {
      claimId: id,
      year: {
        ...year,
        apartmentCosts: [
          ...year.apartmentCosts,
          {
            id,
            dateYmd: amount.dateYmd,
            kind: config.apartmentKind ?? 'rent',
            description: amount.description.trim() || config.defaultDescription,
            localAmount: amount.localAmount,
            exchangeRate: fx.exchangeRate,
            rateFromAto: fx.rateFromAto,
            evidenceVersionId: amount.evidenceVersionId ?? null,
          },
        ],
      },
    }
  }

  if (config.ledger === 'laundry') {
    return {
      claimId: id,
      year: {
        ...year,
        laundry: [
          ...year.laundry,
          {
            id,
            dateYmd: amount.dateYmd,
            description: amount.description.trim() || config.defaultDescription,
            localAmount: amount.localAmount,
            exchangeRate: fx.exchangeRate,
            rateFromAto: fx.rateFromAto,
            evidenceVersionId: amount.evidenceVersionId ?? null,
          },
        ],
      },
    }
  }

  return {
    claimId: id,
    year: {
      ...year,
      otherClaims: [
        ...year.otherClaims,
        {
          id,
          dateYmd: amount.dateYmd,
          description: amount.description.trim() || config.defaultDescription,
          currencyCode: amount.currencyCode,
          localAmount: amount.localAmount,
          exchangeRate: fx.exchangeRate,
          workPercentage: 100,
          rateFromAto: fx.rateFromAto,
          evidenceVersionId: amount.evidenceVersionId ?? null,
        },
      ],
    },
  }
}

export function removeClaimById(year: TaxYearRecord, claimId: string): TaxYearRecord {
  return {
    ...year,
    otherClaims: year.otherClaims.filter((c) => c.id !== claimId),
    flights: year.flights.filter((c) => c.id !== claimId),
    transport: year.transport.filter((c) => c.id !== claimId),
    carKm: year.carKm.filter((c) => c.id !== claimId),
    laundry: year.laundry.filter((c) => c.id !== claimId),
    apartmentCosts: year.apartmentCosts.filter((c) => c.id !== claimId),
  }
}
