import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { useUndoToast } from '@/shared/components/ui/undo-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import {
  foreignToAud,
  lookupAtoRateForMonth,
  type MonthlyIncome,
  type TaxYearRecord,
} from '@/features/tax-position/engine'
import { formatAud } from '@/shared/lib/format'

type IncomePanelProps = {
  year: TaxYearRecord
  onChange: (year: TaxYearRecord) => void
}

const cellInputClass = 'h-9 min-w-[5.5rem] font-normal'

export function IncomePanel({ year, onChange }: IncomePanelProps) {
  const { showUndo } = useUndoToast()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const pendingRow = year.monthlyIncome.find((row) => row.id === pendingDeleteId)

  const addMonth = () => {
    const start = `${year.fyEndYear - 1}-07`
    onChange({
      ...year,
      monthlyIncome: [
        ...year.monthlyIncome,
        {
          id: crypto.randomUUID(),
          monthKey: start,
          incomeUsd5th: 0,
          incomeUsd20th: 0,
          incomeUsd: 0,
          usdAudRate: 0.65,
          usdAudFromAto: false,
        },
      ],
    })
  }

  const updateRow = (index: number, patch: Partial<MonthlyIncome>) => {
    const monthlyIncome = [...year.monthlyIncome]
    monthlyIncome[index] = { ...monthlyIncome[index], ...patch }
    onChange({ ...year, monthlyIncome })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SectionHeader description="USD employment months · AUD = USD ÷ rate" title="Employment income" />
        <Button size="sm" variant="soft" onClick={addMonth}>
          Add month
        </Button>
      </div>

      {year.monthlyIncome.length === 0 ? (
        <EmptyState
          actionLabel="Add employment month"
          description="Enter USD pay and the snapshotted USD/AUD rate for each month."
          title="No employment income"
          onAction={addMonth}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">USD 5th</TableHead>
              <TableHead className="text-right">USD 20th</TableHead>
              <TableHead className="text-right">USD/AUD</TableHead>
              <TableHead className="text-right">AUD</TableHead>
              <TableHead className="w-[1%] text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {year.monthlyIncome.map((row, index) => {
              const usd = row.incomeUsd || row.incomeUsd5th + row.incomeUsd20th
              const aud = foreignToAud(usd, row.usdAudRate)
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Input
                      aria-label={`Month for row ${index + 1}`}
                      className={cellInputClass}
                      placeholder="YYYY-MM"
                      value={row.monthKey}
                      onChange={(e) => updateRow(index, { monthKey: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`USD 5th for ${row.monthKey}`}
                      className={`${cellInputClass} text-right text-amount`}
                      inputMode="decimal"
                      type="number"
                      value={row.incomeUsd5th}
                      onChange={(e) => {
                        const incomeUsd5th = Number(e.target.value)
                        updateRow(index, {
                          incomeUsd5th,
                          incomeUsd: incomeUsd5th + row.incomeUsd20th,
                        })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`USD 20th for ${row.monthKey}`}
                      className={`${cellInputClass} text-right text-amount`}
                      inputMode="decimal"
                      type="number"
                      value={row.incomeUsd20th}
                      onChange={(e) => {
                        const incomeUsd20th = Number(e.target.value)
                        updateRow(index, {
                          incomeUsd20th,
                          incomeUsd: row.incomeUsd5th + incomeUsd20th,
                        })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <Input
                        aria-label={`USD/AUD rate for ${row.monthKey}`}
                        className={`${cellInputClass} max-w-[6.5rem] text-right text-amount`}
                        inputMode="decimal"
                        type="number"
                        value={row.usdAudRate}
                        onChange={(e) =>
                          updateRow(index, {
                            usdAudRate: Number(e.target.value),
                            usdAudFromAto: false,
                          })
                        }
                      />
                      <Button
                        aria-label={`Apply ATO FX rate for ${row.monthKey}`}
                        className="shrink-0 text-muted-foreground"
                        size="sm"
                        title={row.usdAudFromAto ? 'Using ATO FX' : 'Use ATO FX'}
                        variant="ghost"
                        onClick={() => {
                          const [y, m] = row.monthKey.split('-').map(Number)
                          const ato = lookupAtoRateForMonth('USD', y, m)
                          if (!ato) return
                          updateRow(index, {
                            usdAudRate: ato.unitsPerAud,
                            usdAudFromAto: true,
                          })
                        }}
                      >
                        ATO
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-amount text-right font-semibold tabular-nums">
                    {formatAud(aud)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      aria-label={`Remove income month ${row.monthKey}`}
                      className="text-muted-foreground hover:text-destructive"
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDeleteId(row.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <AppCard>
        <SectionHeader
          description="Interest, dividends, rental, CGT, and foreign income — edit via import or extend rows later."
          title="Investments snapshot"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Interest {year.interestByAccount.length} · Dividends {year.dividends.length} · Rental{' '}
          {year.rentalProperties.length} · CGT {year.capitalGains.length} · Other{' '}
          {year.otherInvestments.length}
        </p>
      </AppCard>

      <ConfirmDialog
        confirmLabel="Remove"
        description={
          pendingRow
            ? `This removes the ${pendingRow.monthKey} employment month from your tax position. You can undo immediately after.`
            : 'This removes the employment month from your tax position. You can undo immediately after.'
        }
        destructive
        open={pendingDeleteId != null}
        title="Remove income month?"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return
          const id = pendingDeleteId
          const yearBeforeDelete = year
          const removed = year.monthlyIncome.find((row) => row.id === id)
          onChange({
            ...year,
            monthlyIncome: year.monthlyIncome.filter((row) => row.id !== id),
          })
          setPendingDeleteId(null)
          showUndo({
            message: removed ? `Removed income for ${removed.monthKey}` : 'Income month removed',
            onUndo: () => onChange(yearBeforeDelete),
          })
        }}
      />
    </div>
  )
}
