import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import type { TaxYearRecord } from '@/features/tax-position/engine'

type YearSettingsPanelProps = {
  year: TaxYearRecord
  onChange: (year: TaxYearRecord) => void
}

export function YearSettingsPanel({ year, onChange }: YearSettingsPanelProps) {
  return (
    <div className="space-y-4">
      <SectionHeader description="Scalars that drive the parity engine for this FY" title="Year settings" />
      <AppCard className="grid max-w-lg gap-4">
        <div>
          <Label htmlFor="super">Superannuation (AUD)</Label>
          <Input
            id="super"
            type="number"
            value={year.superannuationAud}
            onChange={(e) => onChange({ ...year, superannuationAud: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="override">Overseas daily override (AUD)</Label>
          <Input
            id="override"
            placeholder="Blank = use nights × rates"
            type="number"
            value={year.overseasDailyOverrideAud ?? ''}
            onChange={(e) =>
              onChange({
                ...year,
                overseasDailyOverrideAud: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
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
