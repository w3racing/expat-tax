import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { TaxYearRecord } from '@/features/tax-position/engine'

type SuperannuationEditorProps = {
  year: TaxYearRecord
  onChange: (year: TaxYearRecord) => void
}

/** Inline FY superannuation input for Tax Position accordion. */
export function SuperannuationEditor({ year, onChange }: SuperannuationEditorProps) {
  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
      <Label htmlFor="position-super">Superannuation (AUD)</Label>
      <Input
        id="position-super"
        inputMode="decimal"
        type="number"
        value={year.superannuationAud}
        onChange={(e) => onChange({ ...year, superannuationAud: Number(e.target.value) })}
      />
      <p className="text-[11px] text-muted-foreground">
        Enter the deductible superannuation amount for this financial year.
      </p>
    </div>
  )
}
