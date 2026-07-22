import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { APARTMENT_LINKS } from '@/features/quick-claim/config/claim-catalog'
import { ClaimNavLink } from '@/features/quick-claim/components/claim-nav-link'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { Button } from '@/shared/components/ui/button'

export function ApartmentMenuPage() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="space-y-2">
        <Button asChild className="-ml-2" size="sm" variant="ghost">
          <Link to="/claim">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <PageHeader
          description="Rent, utilities, and related apartment costs in JPY — with receipt evidence."
          title="Apartment costs"
        />
      </div>
      <nav aria-label="Apartment cost types" className="space-y-2.5">
        {APARTMENT_LINKS.map((item) => (
          <ClaimNavLink key={item.to} subtitle={item.subtitle} title={item.title} to={item.to} />
        ))}
      </nav>
    </div>
  )
}
