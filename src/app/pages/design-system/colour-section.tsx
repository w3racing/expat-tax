import { StyleguideSection } from '@/app/pages/design-system/styleguide-section'

const swatches = [
  { name: 'Mist 50', token: 'var(--ajx-mist-50)', hex: '#F3F6FA' },
  { name: 'Cloud', token: 'var(--ajx-cloud)', hex: '#FFFFFF' },
  { name: 'Ink 950', token: 'var(--ajx-ink-950)', hex: '#0C1524' },
  { name: 'Ink 700', token: 'var(--ajx-ink-700)', hex: '#3D4F63' },
  { name: 'Cerulean 600', token: 'var(--ajx-cerulean-600)', hex: '#0B6E99' },
  { name: 'Cerulean 100', token: 'var(--ajx-cerulean-100)', hex: '#DCEFF6' },
  { name: 'Emerald 600', token: 'var(--ajx-emerald-600)', hex: '#1F7A4D' },
  { name: 'Amber 600', token: 'var(--ajx-amber-600)', hex: '#A65F00' },
  { name: 'Rose 600', token: 'var(--ajx-rose-600)', hex: '#C0392B' },
  { name: 'Line', token: 'var(--ajx-line)', hex: '#D7E0EB' },
] as const

export function ColourSection() {
  return (
    <StyleguideSection
      description="Cool atmospheric neutrals with a single cerulean accent."
      id="colour"
      title="Colour"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {swatches.map((swatch) => (
          <div
            className="overflow-hidden rounded-lg border border-border bg-card shadow-xs"
            key={swatch.name}
          >
            <div className="h-16 border-b border-border" style={{ background: swatch.token }} />
            <div className="space-y-0.5 p-3">
              <p className="text-sm font-semibold">{swatch.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{swatch.hex}</p>
            </div>
          </div>
        ))}
      </div>
    </StyleguideSection>
  )
}
