import { useNavigate } from 'react-router-dom'
import { CaptureEmptyIllustration } from '@/shared/components/ajx/illustrations'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { Button } from '@/shared/components/ui/button'

type DashboardEmptyProps = {
  fyLabel: string
}

export function DashboardEmpty({ fyLabel }: DashboardEmptyProps) {
  const navigate = useNavigate()

  return (
    <EmptyState
      actionLabel="Open overnight planner"
      description={`Nothing in ${fyLabel} yet. Start with overnight counts by destination — or import your Calculator backup.`}
      illustration={<CaptureEmptyIllustration />}
      secondaryAction={
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => navigate('/migration')}>
            Import backup
          </Button>
          <Button variant="ghost" onClick={() => navigate('/evidence')}>
            Upload evidence
          </Button>
        </div>
      }
      title="Your year starts here"
      onAction={() => navigate('/overnight')}
    />
  )
}
