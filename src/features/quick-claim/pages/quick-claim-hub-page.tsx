import { HUB_LINKS } from '@/features/quick-claim/config/claim-catalog'
import { ClaimNavLink } from '@/features/quick-claim/components/claim-nav-link'
import { PageHeader } from '@/shared/components/ajx/page-header'

export function QuickClaimHubPage() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        description="Add a claim to this year’s ledgers. Review under Position → Other expenses."
        title="Quick claim"
      />
      <nav aria-label="Claim categories" className="space-y-2.5">
        {HUB_LINKS.map((item) => (
          <ClaimNavLink key={item.to} subtitle={item.subtitle} title={item.title} to={item.to} />
        ))}
      </nav>
    </div>
  )
}
