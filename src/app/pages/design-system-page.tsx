import { MotionConfig } from 'framer-motion'
import { ColourSection } from '@/app/pages/design-system/colour-section'
import { ComponentsSection } from '@/app/pages/design-system/components-section'
import { IconographySection } from '@/app/pages/design-system/iconography-section'
import { SpacingSection } from '@/app/pages/design-system/spacing-section'
import { TypographySection } from '@/app/pages/design-system/typography-section'
import { FloatingActionButton, FyChip, PageHeader, Separator } from '@/shared/components'

const nav = [
  { href: '#colour', label: 'Colour' },
  { href: '#typography', label: 'Type' },
  { href: '#spacing', label: 'Space' },
  { href: '#iconography', label: 'Icons' },
  { href: '#components', label: 'Components' },
] as const

export function DesignSystemPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto min-h-dvh max-w-5xl px-4 pb-8 pt-8 md:px-6 md:pb-16 md:pt-12">
        <PageHeader
          actions={<FyChip financialYear="2025-26" />}
          description="Canonical visual language for AJX Tax — clean, premium, calm, financial. Reusable components first; product pages next. Light + dark · phone · iPad · Mac."
          title="Design system"
        />

        <nav aria-label="Design system sections" className="mt-8 flex flex-wrap gap-2">
          {nav.map((item) => (
            <a
              className="inline-flex h-10 items-center rounded-full border border-border bg-card px-3.5 text-sm font-semibold text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Separator className="my-10" />

        <div className="space-y-14">
          <ColourSection />
          <TypographySection />
          <SpacingSection />
          <IconographySection />
          <ComponentsSection />
        </div>

        <FloatingActionButton label="Example capture FAB" />
      </div>
    </MotionConfig>
  )
}
