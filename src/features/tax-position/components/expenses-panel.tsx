import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import {
  claimAud,
  foreignToAud,
  lookupAtoRateForMonth,
  type TaxYearRecord,
} from '@/features/tax-position/engine'
import { formatAud } from '@/shared/lib/format'

type ExpensesPanelProps = {
  year: TaxYearRecord
  onChange: (year: TaxYearRecord) => void
}

export function ExpensesPanel({ year, onChange }: ExpensesPanelProps) {
  const addWork = () => {
    onChange({
      ...year,
      otherClaims: [
        ...year.otherClaims,
        {
          id: crypto.randomUUID(),
          dateYmd: new Date().toISOString().slice(0, 10),
          description: 'Work expense',
          currencyCode: 'AUD',
          localAmount: 0,
          exchangeRate: 1,
          workPercentage: 100,
          rateFromAto: false,
        },
      ],
    })
  }

  const carKmRows = (() => {
    let remaining = 5000
    return year.carKm.map((claim) => {
      const claimable = Math.min(claim.kilometres, remaining)
      remaining -= claimable
      return {
        claim,
        amountAud: (claimable * claim.centsPerKm) / 100,
      }
    })
  })()
  const carKmTotalAud = carKmRows.reduce((s, r) => s + r.amountAud, 0)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionHeader
            description="Work claims · AUD = foreign ÷ rate × work%"
            title="Expense claims"
          />
          <Button size="sm" variant="soft" onClick={addWork}>
            Add claim
          </Button>
        </div>

        {year.otherClaims.length === 0 ? (
          <EmptyState
            actionLabel="Add work claim"
            description="Multi-currency work expenses with snapshotted FX. Date and description stay with each claim for later review."
            title="No work expenses"
            onAction={addWork}
          />
        ) : (
          <ul className="space-y-3">
            {year.otherClaims.map((claim, index) => {
              const aud = foreignToAud(claim.localAmount, claim.exchangeRate) * (claim.workPercentage / 100)
              return (
                <AppCard key={claim.id} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={claim.dateYmd ?? ''}
                      onChange={(e) => {
                        const otherClaims = [...year.otherClaims]
                        otherClaims[index] = { ...claim, dateYmd: e.target.value || undefined }
                        onChange({ ...year, otherClaims })
                      }}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={claim.description ?? ''}
                      onChange={(e) => {
                        const otherClaims = [...year.otherClaims]
                        otherClaims[index] = { ...claim, description: e.target.value }
                        onChange({ ...year, otherClaims })
                      }}
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input
                      value={claim.currencyCode}
                      onChange={(e) => {
                        const otherClaims = [...year.otherClaims]
                        otherClaims[index] = { ...claim, currencyCode: e.target.value.toUpperCase() }
                        onChange({ ...year, otherClaims })
                      }}
                    />
                  </div>
                  <div>
                    <Label>Local amount</Label>
                    <Input
                      type="number"
                      value={claim.localAmount}
                      onChange={(e) => {
                        const otherClaims = [...year.otherClaims]
                        otherClaims[index] = { ...claim, localAmount: Number(e.target.value) }
                        onChange({ ...year, otherClaims })
                      }}
                    />
                  </div>
                  <div>
                    <Label>FX rate</Label>
                    <Input
                      type="number"
                      value={claim.exchangeRate}
                      onChange={(e) => {
                        const otherClaims = [...year.otherClaims]
                        otherClaims[index] = {
                          ...claim,
                          exchangeRate: Number(e.target.value),
                          rateFromAto: false,
                        }
                        onChange({ ...year, otherClaims })
                      }}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-6">
                    <p className="text-overline">Result</p>
                    <p className="text-amount text-sm font-semibold">{formatAud(aud)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const ato = lookupAtoRateForMonth(claim.currencyCode, year.fyEndYear - 1, 7)
                        if (!ato) return
                        const otherClaims = [...year.otherClaims]
                        otherClaims[index] = {
                          ...claim,
                          exchangeRate: ato.unitsPerAud,
                          rateFromAto: true,
                        }
                        onChange({ ...year, otherClaims })
                      }}
                    >
                      ATO FX
                    </Button>
                  </div>
                </AppCard>
              )
            })}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader
          description="Date, description, and AUD — edit narrative so you can prove why you claimed each item later."
          title="Claim ledgers"
        />

        <LedgerSection
          count={year.flights.length}
          empty="No flight claims for this year."
          title="Flights"
          totalAud={year.flights.reduce(
            (s, c) => s + claimAud(c.localAmount, c.exchangeRate, c.workPercentage),
            0,
          )}
        >
          {year.flights.map((claim, index) => (
            <LedgerRow
              key={claim.id}
              amountAud={claimAud(claim.localAmount, claim.exchangeRate, claim.workPercentage)}
              currencyNote={
                claim.currencyCode !== 'AUD' ? `${claim.currencyCode} ${claim.localAmount}` : undefined
              }
              dateYmd={claim.dateYmd}
              description={claim.description ?? ''}
              descriptionPlaceholder="e.g. BNE–SYD for US Visa interview"
              onDateChange={(dateYmd) => {
                const flights = [...year.flights]
                flights[index] = { ...claim, dateYmd: dateYmd || undefined }
                onChange({ ...year, flights })
              }}
              onDescriptionChange={(description) => {
                const flights = [...year.flights]
                flights[index] = { ...claim, description }
                onChange({ ...year, flights })
              }}
            />
          ))}
        </LedgerSection>

        <LedgerSection
          count={year.transport.length}
          empty="No transport claims for this year."
          title="Transport"
          totalAud={year.transport.reduce(
            (s, c) =>
              s +
              claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
                manualAud: c.manualAud,
                amountAud: c.audAmount,
              }),
            0,
          )}
        >
          {year.transport.map((claim, index) => (
            <LedgerRow
              key={claim.id}
              amountAud={claimAud(claim.localAmount, claim.exchangeRate, claim.workPercentage, {
                manualAud: claim.manualAud,
                amountAud: claim.audAmount,
              })}
              currencyNote={
                claim.currencyCode !== 'AUD' ? `${claim.currencyCode} ${claim.localAmount}` : undefined
              }
              dateYmd={claim.dateYmd}
              description={claim.description ?? ''}
              descriptionPlaceholder="e.g. Taxi to airport · Narita"
              onDateChange={(dateYmd) => {
                const transport = [...year.transport]
                transport[index] = { ...claim, dateYmd: dateYmd || undefined }
                onChange({ ...year, transport })
              }}
              onDescriptionChange={(description) => {
                const transport = [...year.transport]
                transport[index] = { ...claim, description }
                onChange({ ...year, transport })
              }}
            />
          ))}
        </LedgerSection>

        <LedgerSection
          count={year.carKm.length}
          empty="No car kilometre claims for this year."
          title="Car kilometres"
          totalAud={carKmTotalAud}
        >
          {carKmRows.map(({ claim, amountAud }, index) => (
              <LedgerRow
                key={claim.id}
                amountAud={amountAud}
                currencyNote={`${claim.kilometres} km @ ${claim.centsPerKm}¢`}
                dateYmd={claim.dateYmd}
                description={claim.description ?? ''}
                descriptionPlaceholder="e.g. Airport car park run"
                onDateChange={(dateYmd) => {
                  const carKm = [...year.carKm]
                  carKm[index] = { ...claim, dateYmd: dateYmd || undefined }
                  onChange({ ...year, carKm })
                }}
                onDescriptionChange={(description) => {
                  const carKm = [...year.carKm]
                  carKm[index] = { ...claim, description }
                  onChange({ ...year, carKm })
                }}
              />
          ))}
        </LedgerSection>

        <LedgerSection
          count={year.laundry.length}
          empty="No laundry claims for this year."
          title="Laundry"
          totalAud={year.laundry.reduce((s, c) => s + foreignToAud(c.localAmount, c.exchangeRate), 0)}
        >
          {year.laundry.map((claim, index) => (
            <LedgerRow
              key={claim.id}
              amountAud={foreignToAud(claim.localAmount, claim.exchangeRate)}
              currencyNote={`JPY ${claim.localAmount}`}
              dateYmd={claim.dateYmd}
              description={claim.description ?? ''}
              descriptionPlaceholder="Laundry"
              onDateChange={(dateYmd) => {
                const laundry = [...year.laundry]
                laundry[index] = { ...claim, dateYmd: dateYmd || undefined }
                onChange({ ...year, laundry })
              }}
              onDescriptionChange={(description) => {
                const laundry = [...year.laundry]
                laundry[index] = { ...claim, description }
                onChange({ ...year, laundry })
              }}
            />
          ))}
        </LedgerSection>

        <LedgerSection
          count={year.apartmentCosts.length}
          empty="No apartment claims for this year."
          title="Apartment"
          totalAud={year.apartmentCosts.reduce(
            (s, c) => s + foreignToAud(c.localAmount, c.exchangeRate),
            0,
          )}
        >
          {year.apartmentCosts.map((claim, index) => (
            <LedgerRow
              key={claim.id}
              amountAud={foreignToAud(claim.localAmount, claim.exchangeRate)}
              currencyNote={`JPY ${claim.localAmount}`}
              dateYmd={claim.dateYmd}
              description={claim.description ?? claim.kind}
              descriptionPlaceholder={claim.kind}
              onDateChange={(dateYmd) => {
                const apartmentCosts = [...year.apartmentCosts]
                apartmentCosts[index] = { ...claim, dateYmd: dateYmd || undefined }
                onChange({ ...year, apartmentCosts })
              }}
              onDescriptionChange={(description) => {
                const apartmentCosts = [...year.apartmentCosts]
                apartmentCosts[index] = { ...claim, description }
                onChange({ ...year, apartmentCosts })
              }}
            />
          ))}
        </LedgerSection>

        <p className="text-xs text-muted-foreground">
          Travel nights {year.monthAway.reduce((s, m) => s + m.nights, 0)} — edit counts in the{' '}
          <Link className="font-medium text-primary underline-offset-2 hover:underline" to="/overnight">
            Overnight planner
          </Link>
          . Re-import a planner backup if dates were dropped by an older import.
        </p>
      </div>
    </div>
  )
}

function LedgerSection({
  title,
  empty,
  count,
  totalAud,
  children,
}: {
  title: string
  empty: string
  count: number
  totalAud: number
  children: ReactNode
}) {
  if (count === 0) {
    return (
      <AppCard className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{empty}</p>
      </AppCard>
    )
  }

  return (
    <AppCard className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">
          {count} · {formatAud(totalAud)}
        </p>
      </div>
      <ul className="space-y-3">{children}</ul>
    </AppCard>
  )
}

function LedgerRow({
  dateYmd,
  description,
  descriptionPlaceholder,
  amountAud,
  currencyNote,
  onDateChange,
  onDescriptionChange,
}: {
  dateYmd?: string
  description: string
  descriptionPlaceholder: string
  amountAud: number
  currencyNote?: string
  onDateChange: (dateYmd: string) => void
  onDescriptionChange: (description: string) => void
}) {
  return (
    <li className="grid gap-2 border-b border-border/60 pb-3 last:border-0 last:pb-0 sm:grid-cols-[9rem_1fr_auto]">
      <div>
        <Label className="sr-only">Date</Label>
        <Input
          aria-label="Claim date"
          type="date"
          value={dateYmd ?? ''}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
      <div>
        <Label className="sr-only">Description</Label>
        <Input
          aria-label="Claim description"
          placeholder={descriptionPlaceholder}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
        {currencyNote ? (
          <p className="mt-1 text-[11px] text-muted-foreground">{currencyNote}</p>
        ) : null}
      </div>
      <p className="text-amount self-center text-sm font-semibold sm:text-right">
        {formatAud(amountAud)}
      </p>
    </li>
  )
}
