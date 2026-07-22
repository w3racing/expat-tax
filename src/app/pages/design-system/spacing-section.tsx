import { StyleguideSection } from '@/app/pages/design-system/styleguide-section'
import { AppCard } from '@/shared/components/ajx/app-card'

const spaces = [4, 8, 12, 16, 20, 24, 32, 40, 48] as const

export function SpacingSection() {
  return (
    <StyleguideSection
      description="4px base scale. Cards use soft shadows and 16px radius."
      id="spacing"
      title="Spacing & elevation"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <AppCard>
          <p className="text-overline mb-4">Spacing scale</p>
          <div className="space-y-2">
            {spaces.map((px) => (
              <div className="flex items-center gap-3" key={px}>
                <span className="w-10 font-mono text-xs text-muted-foreground">{px}</span>
                <div className="h-3 rounded-sm bg-primary/80" style={{ width: px * 4 }} />
              </div>
            ))}
          </div>
        </AppCard>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold">Card · shadow-sm</p>
            <p className="mt-1 text-sm text-muted-foreground">Default elevated surface</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-md">
            <p className="text-sm font-semibold">Raised · shadow-md</p>
            <p className="mt-1 text-sm text-muted-foreground">FAB, popovers, floating chrome</p>
          </div>
        </div>
      </div>
    </StyleguideSection>
  )
}
