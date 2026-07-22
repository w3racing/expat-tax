import { Camera, Files, Plane, Settings, Sparkles } from 'lucide-react'
import { StyleguideSection } from '@/app/pages/design-system/styleguide-section'
import { AppCard } from '@/shared/components/ajx/app-card'

const icons = [
  { name: 'Camera', Icon: Camera },
  { name: 'Files', Icon: Files },
  { name: 'Plane', Icon: Plane },
  { name: 'Sparkles', Icon: Sparkles },
  { name: 'Settings', Icon: Settings },
] as const

export function IconographySection() {
  return (
    <StyleguideSection
      description="Lucide icons. Default 20px. Inherit text colour."
      id="iconography"
      title="Iconography"
    >
      <AppCard>
        <div className="flex flex-wrap gap-6">
          {icons.map(({ name, Icon }) => (
            <div className="flex flex-col items-center gap-2" key={name}>
              <div className="flex size-11 items-center justify-center rounded-md bg-accent text-primary">
                <Icon aria-hidden className="size-5" strokeWidth={2} />
              </div>
              <span className="text-xs text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </AppCard>
    </StyleguideSection>
  )
}
