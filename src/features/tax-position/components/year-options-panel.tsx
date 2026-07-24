import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import type { TaxYearRecord } from '@/features/tax-position/engine'

type YearOptionsPanelProps = {
  year: TaxYearRecord
  onChange: (year: TaxYearRecord) => void
}

/**
 * Advanced year scalars — Medicare, overnight override, notes.
 * Superannuation is edited on the Superannuation accordion row.
 */
export function YearOptionsPanel({ year, onChange }: YearOptionsPanelProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        description="Rare adjustments for this financial year"
        title="Year options"
      />
      <AppCard className="grid max-w-lg gap-4">
        <div>
          <Label htmlFor="override">Overseas daily override (AUD)</Label>
          <Input
            id="override"
            placeholder="Blank = nights × destination rates"
            type="number"
            value={year.overseasDailyOverrideAud ?? ''}
            onChange={(e) =>
              onChange({
                ...year,
                overseasDailyOverrideAud: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Prefer destination sample-day averages. Only override when you need a year-level figure.
          </p>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            checked={year.includeMedicareLevy}
            className="size-4 accent-[var(--primary)]"
            type="checkbox"
            onChange={(e) => onChange({ ...year, includeMedicareLevy: e.target.checked })}
          />
          Include Medicare levy (2%)
        </label>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={year.notes}
            onChange={(e) => onChange({ ...year, notes: e.target.value })}
          />
        </div>
      </AppCard>
    </div>
  )
}
