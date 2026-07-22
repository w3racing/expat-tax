import { Download, MapPinned, Settings, Upload, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { QuickActionBar, type QuickAction } from '@/shared/components/ajx/quick-action-bar'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { AppCard } from '@/shared/components/ajx/app-card'

export function DashboardQuickActions() {
  const navigate = useNavigate()

  const actions: QuickAction[] = [
    {
      id: 'overnight',
      label: 'Overnight planner',
      icon: <MapPinned className="size-4" />,
      onSelect: () => navigate('/overnight'),
    },
    {
      id: 'upload',
      label: 'Upload evidence',
      icon: <Upload className="size-4" />,
      onSelect: () => navigate('/evidence'),
    },
    {
      id: 'position',
      label: 'Tax position',
      icon: <Wallet className="size-4" />,
      onSelect: () => navigate('/position'),
    },
    {
      id: 'export',
      label: 'Accountant export',
      icon: <Download className="size-4" />,
      onSelect: () => navigate('/export'),
    },
    {
      id: 'backup',
      label: 'Backup & restore',
      icon: <Settings className="size-4" />,
      onSelect: () => navigate('/settings'),
    },
  ]

  return (
    <AppCard
      header={
        <SectionHeader
          description="Complete the overnight claim loop end-to-end"
          title="Quick actions"
        />
      }
    >
      <QuickActionBar actions={actions} />
    </AppCard>
  )
}
