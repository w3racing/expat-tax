import type { ApartmentKind, TransportKind } from '@/features/tax-position/engine/types'

export const CLAIM_CURRENCIES = ['JPY', 'AUD', 'USD', 'EUR'] as const
export type ClaimCurrency = (typeof CLAIM_CURRENCIES)[number]

export type ClaimFormMode = 'amount' | 'car-km'

export type ClaimFormConfig = {
  id: string
  title: string
  description: string
  backTo: string
  mode: ClaimFormMode
  ledger: 'flights' | 'transport' | 'carKm' | 'apartmentCosts' | 'otherClaims' | 'laundry'
  transportKind?: TransportKind
  apartmentKind?: ApartmentKind
  currencies: readonly ClaimCurrency[]
  defaultCurrency: ClaimCurrency
  showEvidence: boolean
  evidenceCategory: 'flight' | 'receipt' | 'travel' | 'other'
  defaultDescription?: string
}

export const HUB_LINKS = [
  {
    to: '/claim/transport',
    title: 'Transport',
    subtitle: 'Train, bus, taxi, airfares, car',
  },
  {
    to: '/claim/work',
    title: 'General work-related expenses',
    subtitle: 'Other deductible costs',
  },
  {
    to: '/claim/laundry',
    title: 'Laundry',
    subtitle: 'Uniform and work laundry (JPY)',
  },
  {
    to: '/claim/apartment',
    title: 'Apartment costs',
    subtitle: 'Rent, water, gas, electricity (JPY)',
  },
  {
    to: '/claim/destinations',
    title: 'Destinations',
    subtitle: 'Sample days — meals & incidentals',
  },
] as const

export const TRANSPORT_LINKS = [
  { to: '/claim/transport/airfares', title: 'Airfares', subtitle: 'Flights with evidence' },
  { to: '/claim/transport/train', title: 'Train', subtitle: 'Rail fares' },
  { to: '/claim/transport/bus', title: 'Bus', subtitle: 'Bus and coach' },
  { to: '/claim/transport/taxi', title: 'Taxi', subtitle: 'Taxi and rideshare' },
  { to: '/claim/transport/car', title: 'Car', subtitle: 'ATO cents-per-km · max 5,000 km' },
] as const

export const APARTMENT_LINKS = [
  { to: '/claim/apartment/rent', title: 'Rent', subtitle: 'JPY with evidence' },
  { to: '/claim/apartment/electricity', title: 'Electricity', subtitle: 'JPY with evidence' },
  { to: '/claim/apartment/gas', title: 'Gas', subtitle: 'JPY with evidence' },
  { to: '/claim/apartment/water', title: 'Water', subtitle: 'JPY with evidence' },
] as const

const multiCurrency = CLAIM_CURRENCIES
const jpyOnly = ['JPY'] as const satisfies readonly ClaimCurrency[]

export const CLAIM_FORMS: Record<string, ClaimFormConfig> = {
  'transport/airfares': {
    id: 'transport/airfares',
    title: 'Airfares',
    description: 'Adds to the Flights claim ledger.',
    backTo: '/claim/transport',
    mode: 'amount',
    ledger: 'flights',
    currencies: multiCurrency,
    defaultCurrency: 'JPY',
    showEvidence: true,
    evidenceCategory: 'flight',
    defaultDescription: 'Airfare',
  },
  'transport/train': {
    id: 'transport/train',
    title: 'Train',
    description: 'Adds to the Transport claim ledger.',
    backTo: '/claim/transport',
    mode: 'amount',
    ledger: 'transport',
    transportKind: 'train',
    currencies: multiCurrency,
    defaultCurrency: 'JPY',
    showEvidence: false,
    evidenceCategory: 'travel',
    defaultDescription: 'Train',
  },
  'transport/bus': {
    id: 'transport/bus',
    title: 'Bus',
    description: 'Adds to the Transport claim ledger.',
    backTo: '/claim/transport',
    mode: 'amount',
    ledger: 'transport',
    transportKind: 'bus',
    currencies: multiCurrency,
    defaultCurrency: 'JPY',
    showEvidence: true,
    evidenceCategory: 'travel',
    defaultDescription: 'Bus',
  },
  'transport/taxi': {
    id: 'transport/taxi',
    title: 'Taxi',
    description: 'Adds to the Transport claim ledger.',
    backTo: '/claim/transport',
    mode: 'amount',
    ledger: 'transport',
    transportKind: 'taxi',
    currencies: multiCurrency,
    defaultCurrency: 'JPY',
    showEvidence: true,
    evidenceCategory: 'travel',
    defaultDescription: 'Taxi',
  },
  'transport/car': {
    id: 'transport/car',
    title: 'Car kilometres',
    description: 'ATO cents-per-km method · claimable up to 5,000 km per year.',
    backTo: '/claim/transport',
    mode: 'car-km',
    ledger: 'carKm',
    currencies: ['AUD'],
    defaultCurrency: 'AUD',
    showEvidence: false,
    evidenceCategory: 'travel',
    defaultDescription: 'Car kilometres',
  },
  work: {
    id: 'work',
    title: 'General work-related expenses',
    description: 'Adds to the General work expense claims ledger.',
    backTo: '/claim',
    mode: 'amount',
    ledger: 'otherClaims',
    currencies: multiCurrency,
    defaultCurrency: 'JPY',
    showEvidence: false,
    evidenceCategory: 'receipt',
    defaultDescription: 'Work expense',
  },
  laundry: {
    id: 'laundry',
    title: 'Laundry',
    description: 'Adds to the Laundry claim ledger (JPY).',
    backTo: '/claim',
    mode: 'amount',
    ledger: 'laundry',
    currencies: jpyOnly,
    defaultCurrency: 'JPY',
    showEvidence: true,
    evidenceCategory: 'receipt',
    defaultDescription: 'Laundry',
  },
  'apartment/rent': {
    id: 'apartment/rent',
    title: 'Rent',
    description: 'Adds to the Apartment claim ledger (JPY).',
    backTo: '/claim/apartment',
    mode: 'amount',
    ledger: 'apartmentCosts',
    apartmentKind: 'rent',
    currencies: jpyOnly,
    defaultCurrency: 'JPY',
    showEvidence: true,
    evidenceCategory: 'receipt',
    defaultDescription: 'Rent',
  },
  'apartment/electricity': {
    id: 'apartment/electricity',
    title: 'Electricity',
    description: 'Adds to the Apartment claim ledger (JPY).',
    backTo: '/claim/apartment',
    mode: 'amount',
    ledger: 'apartmentCosts',
    apartmentKind: 'electricity',
    currencies: jpyOnly,
    defaultCurrency: 'JPY',
    showEvidence: true,
    evidenceCategory: 'receipt',
    defaultDescription: 'Electricity',
  },
  'apartment/gas': {
    id: 'apartment/gas',
    title: 'Gas',
    description: 'Adds to the Apartment claim ledger (JPY).',
    backTo: '/claim/apartment',
    mode: 'amount',
    ledger: 'apartmentCosts',
    apartmentKind: 'gas',
    currencies: jpyOnly,
    defaultCurrency: 'JPY',
    showEvidence: true,
    evidenceCategory: 'receipt',
    defaultDescription: 'Gas',
  },
  'apartment/water': {
    id: 'apartment/water',
    title: 'Water',
    description: 'Adds to the Apartment claim ledger (JPY).',
    backTo: '/claim/apartment',
    mode: 'amount',
    ledger: 'apartmentCosts',
    apartmentKind: 'water',
    currencies: jpyOnly,
    defaultCurrency: 'JPY',
    showEvidence: true,
    evidenceCategory: 'receipt',
    defaultDescription: 'Water',
  },
}

export function getClaimFormConfig(pathKey: string): ClaimFormConfig | null {
  return CLAIM_FORMS[pathKey] ?? null
}
