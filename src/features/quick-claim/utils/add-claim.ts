import {
  CAR_KM_ANNUAL_MAX,
  DEFAULT_CENTS_PER_KM_FY2026,
} from '@/features/tax-position/engine/constants'
import type {
  ApartmentClaim,
  CarKmClaim,
  FlightClaim,
  LaundryClaim,
  TaxYearRecord,
  TransportClaim,
  WorkClaim,
} from '@/features/tax-position/engine/types'
import type { ClaimFormConfig } from '@/features/quick-claim/config/claim-catalog'
import { CLAIM_FORMS } from '@/features/quick-claim/config/claim-catalog'
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

export type FoundClaim =
  | { ledger: 'otherClaims'; claim: WorkClaim }
  | { ledger: 'flights'; claim: FlightClaim }
  | { ledger: 'transport'; claim: TransportClaim }
  | { ledger: 'carKm'; claim: CarKmClaim }
  | { ledger: 'laundry'; claim: LaundryClaim }
  | { ledger: 'apartmentCosts'; claim: ApartmentClaim }

export type ClaimUpdatePatch = {
  dateYmd?: string
  description?: string
  currencyCode?: string
  localAmount?: number
  exchangeRate?: number
  rateFromAto?: boolean
  kilometres?: number
}

export function findClaimById(year: TaxYearRecord, claimId: string): FoundClaim | null {
  const other = year.otherClaims.find((c) => c.id === claimId)
  if (other) return { ledger: 'otherClaims', claim: other }
  const flight = year.flights.find((c) => c.id === claimId)
  if (flight) return { ledger: 'flights', claim: flight }
  const transport = year.transport.find((c) => c.id === claimId)
  if (transport) return { ledger: 'transport', claim: transport }
  const car = year.carKm.find((c) => c.id === claimId)
  if (car) return { ledger: 'carKm', claim: car }
  const laundry = year.laundry.find((c) => c.id === claimId)
  if (laundry) return { ledger: 'laundry', claim: laundry }
  const apartment = year.apartmentCosts.find((c) => c.id === claimId)
  if (apartment) return { ledger: 'apartmentCosts', claim: apartment }
  return null
}

/** Form config matching how the claim was created (for edit UI). */
export function claimFormConfigForFound(found: FoundClaim): ClaimFormConfig {
  if (found.ledger === 'flights') return CLAIM_FORMS['transport/airfares']
  if (found.ledger === 'carKm') return CLAIM_FORMS['transport/car']
  if (found.ledger === 'laundry') return CLAIM_FORMS.laundry
  if (found.ledger === 'otherClaims') return CLAIM_FORMS.work
  if (found.ledger === 'transport') {
    const kind = found.claim.kind
    if (kind === 'bus') return CLAIM_FORMS['transport/bus']
    if (kind === 'taxi') return CLAIM_FORMS['transport/taxi']
    return CLAIM_FORMS['transport/train']
  }
  const kind = found.claim.kind
  if (kind === 'electricity') return CLAIM_FORMS['apartment/electricity']
  if (kind === 'gas') return CLAIM_FORMS['apartment/gas']
  if (kind === 'water') return CLAIM_FORMS['apartment/water']
  return CLAIM_FORMS['apartment/rent']
}

function mapLedger<T extends { id: string }>(
  rows: T[],
  claimId: string,
  map: (row: T) => T,
): T[] {
  return rows.map((row) => (row.id === claimId ? map(row) : row))
}

export function updateClaimById(
  year: TaxYearRecord,
  claimId: string,
  patch: ClaimUpdatePatch,
): TaxYearRecord {
  const found = findClaimById(year, claimId)
  if (!found) return year

  const dateYmd = patch.dateYmd !== undefined ? patch.dateYmd : found.claim.dateYmd
  const description =
    patch.description !== undefined ? patch.description.trim() : found.claim.description

  if (found.ledger === 'carKm') {
    return {
      ...year,
      carKm: mapLedger(year.carKm, claimId, (row) => ({
        ...row,
        dateYmd,
        description,
        kilometres:
          typeof patch.kilometres === 'number' ? Math.max(0, patch.kilometres) : row.kilometres,
      })),
    }
  }

  const localAmount =
    typeof patch.localAmount === 'number' ? Math.max(0, patch.localAmount) : found.claim.localAmount
  const exchangeRate =
    typeof patch.exchangeRate === 'number' ? patch.exchangeRate : found.claim.exchangeRate
  const rateFromAto =
    typeof patch.rateFromAto === 'boolean' ? patch.rateFromAto : found.claim.rateFromAto

  if (found.ledger === 'laundry') {
    return {
      ...year,
      laundry: mapLedger(year.laundry, claimId, (row) => ({
        ...row,
        dateYmd,
        description,
        localAmount,
        exchangeRate,
        rateFromAto,
        manualAud: false,
      })),
    }
  }

  if (found.ledger === 'apartmentCosts') {
    return {
      ...year,
      apartmentCosts: mapLedger(year.apartmentCosts, claimId, (row) => ({
        ...row,
        dateYmd,
        description,
        localAmount,
        exchangeRate,
        rateFromAto,
        manualAud: false,
      })),
    }
  }

  const currencyCode =
    patch.currencyCode !== undefined
      ? patch.currencyCode.toUpperCase()
      : found.claim.currencyCode

  if (found.ledger === 'flights') {
    return {
      ...year,
      flights: mapLedger(year.flights, claimId, (row) => ({
        ...row,
        dateYmd,
        description,
        currencyCode,
        localAmount,
        exchangeRate,
        rateFromAto,
        manualAud: false,
      })),
    }
  }

  if (found.ledger === 'transport') {
    return {
      ...year,
      transport: mapLedger(year.transport, claimId, (row) => ({
        ...row,
        dateYmd,
        description,
        currencyCode,
        localAmount,
        exchangeRate,
        rateFromAto,
        manualAud: false,
        audAmount: undefined,
      })),
    }
  }

  return {
    ...year,
    otherClaims: mapLedger(year.otherClaims, claimId, (row) => ({
      ...row,
      dateYmd,
      description,
      currencyCode,
      localAmount,
      exchangeRate,
      rateFromAto,
      manualAud: false,
      amountAud: undefined,
    })),
  }
}

/** Kilometres remaining this year excluding one existing car claim (for edit). */
export function carKmRemainingExcluding(year: TaxYearRecord, excludeClaimId: string): number {
  const entered = year.carKm.reduce(
    (s, c) => s + (c.id === excludeClaimId ? 0 : c.kilometres),
    0,
  )
  return Math.max(0, CAR_KM_ANNUAL_MAX - entered)
}
