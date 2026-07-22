import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTaxPosition } from '@/features/tax-position'
import { sortedDestinations } from '@/features/overnight-planner/utils/overnight-matrix'
import { listSampleDays } from '@/features/destination-workspace/services/sample-day-store'
import { ClaimNavLink } from '@/features/quick-claim/components/claim-nav-link'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { Button } from '@/shared/components/ui/button'
import { formatNumber } from '@/shared/lib/format'

export function DestinationsMenuPage() {
  const navigate = useNavigate()
  const { fyEndYear, planner } = useTaxPosition()
  const destinations = sortedDestinations(planner.destinations)

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
          description="Pick a destination to add sample days for meals and incidentals."
          title="Destinations"
        />
      </div>

      {destinations.length === 0 ? (
        <EmptyState
          actionLabel="Open Overnight tab"
          description="Add destinations in the Overnight tab first, then come back here to enter sample days."
          title="No destinations yet"
          onAction={() => navigate('/overnight')}
        />
      ) : (
        <nav aria-label="Destinations" className="space-y-2.5">
          {destinations.map((destination) => {
            const sampleCount = listSampleDays(fyEndYear, destination.id).length
            const subtitle =
              sampleCount === 0
                ? 'No sample days yet'
                : `${formatNumber(sampleCount)} sample day${sampleCount === 1 ? '' : 's'}`
            return (
              <ClaimNavLink
                key={destination.id}
                subtitle={subtitle}
                title={destination.name}
                to={`/overnight/${destination.id}?from=claim`}
              />
            )
          })}
        </nav>
      )}
    </div>
  )
}
