import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'

const CLAIM_SECTION_CTAS: Record<string, { label: string; to: string }> = {
  'other-claims': { label: 'Add or edit in Claim', to: '/claim/work' },
  flights: { label: 'Add or edit in Claim', to: '/claim/transport/airfares' },
  transport: { label: 'Add or edit in Claim', to: '/claim/transport' },
  'car-km': { label: 'Add or edit in Claim', to: '/claim/transport/car' },
  laundry: { label: 'Add or edit in Claim', to: '/claim/laundry' },
  apartment: { label: 'Add or edit in Claim', to: '/claim/apartment' },
}

type ClaimSectionCtaProps = {
  traceId: string
}

/** Points claim ledger rows back to Claim — Tax Position is display + provenance only. */
export function ClaimSectionCta({ traceId }: ClaimSectionCtaProps) {
  const cta = CLAIM_SECTION_CTAS[traceId]
  if (!cta) return null
  return (
    <Button asChild className="w-full sm:w-auto" size="sm" variant="soft">
      <Link to={cta.to}>{cta.label}</Link>
    </Button>
  )
}

export function isClaimTraceId(id: string): boolean {
  return id in CLAIM_SECTION_CTAS
}
