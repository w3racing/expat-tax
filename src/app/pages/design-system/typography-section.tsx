import { StyleguideSection } from '@/app/pages/design-system/styleguide-section'
import { AppCard } from '@/shared/components/ajx/app-card'

export function TypographySection() {
  return (
    <StyleguideSection
      description="Sora for display. Plus Jakarta Sans for UI. IBM Plex Mono for amounts."
      id="typography"
      title="Typography"
    >
      <AppCard>
        <div className="space-y-6">
          <div>
            <p className="text-overline mb-2">Display · Sora</p>
            <p className="font-display text-4xl font-semibold tracking-tight">AJX Tax</p>
          </div>
          <div>
            <p className="text-overline mb-2">Title</p>
            <p className="font-display text-[1.75rem] font-semibold tracking-tight">
              Your tax return, built automatically
            </p>
          </div>
          <div>
            <p className="text-overline mb-2">Body · Plus Jakarta Sans</p>
            <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
              Capture once. Never think about it again. Every receipt, payslip, roster, and flight
              is organised throughout the year — calmly, automatically.
            </p>
          </div>
          <div>
            <p className="text-overline mb-2">Amount · IBM Plex Mono</p>
            <p className="text-amount text-xl font-medium">A$248.60</p>
          </div>
        </div>
      </AppCard>
    </StyleguideSection>
  )
}
