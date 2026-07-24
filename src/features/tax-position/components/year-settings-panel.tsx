import { SuperannuationEditor } from '@/features/tax-position/components/superannuation-editor'
import { YearOptionsPanel } from '@/features/tax-position/components/year-options-panel'
import type { TaxYearRecord } from '@/features/tax-position/engine'

type YearSettingsPanelProps = {
  year: TaxYearRecord
  onChange: (year: TaxYearRecord) => void
}

/** @deprecated Prefer SuperannuationEditor + YearOptionsPanel on Tax Position. */
export function YearSettingsPanel({ year, onChange }: YearSettingsPanelProps) {
  return (
    <div className="space-y-6">
      <SuperannuationEditor year={year} onChange={onChange} />
      <YearOptionsPanel year={year} onChange={onChange} />
    </div>
  )
}
