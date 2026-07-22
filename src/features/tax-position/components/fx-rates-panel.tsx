import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { listAtoCurrencies, listAtoRatesForCurrency } from '@/features/tax-position/engine'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'

/** Reference ATO FX table — does not auto-overwrite claim snapshots. */
export function FxRatesPanel() {
  const currencies = listAtoCurrencies()
  const [code, setCode] = useState(currencies[0] ?? 'USD')
  const rows = listAtoRatesForCurrency(code)

  return (
    <div className="space-y-4">
      <SectionHeader
        description="Units of foreign currency per A$1. Snapshots on income/claims stay authoritative."
        title="ATO FX rates"
      />
      <SoftBanner tone="info">
        Applying “Use ATO FX” on a row copies the reference rate onto that row and sets rateFromAto.
        Claims saved before a month is published stay pending until you use Settings → Refresh ATO
        rates. Manual rates are never overwritten by that refresh.
      </SoftBanner>
      <div className="flex flex-wrap gap-2">
        {currencies.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={c === code ? 'soft' : 'outline'}
            onClick={() => setCode(c)}
          >
            {c}
          </Button>
        ))}
      </div>
      <AppCard className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Units / A$1</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.year}-${r.month}`}>
                <TableCell>
                  {r.year}-{String(r.month).padStart(2, '0')}
                </TableCell>
                <TableCell className="text-amount">{r.unitsPerAud}</TableCell>
                <TableCell className="text-muted-foreground">{r.sourceVersion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppCard>
    </div>
  )
}
