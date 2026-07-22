import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import {
  claimAud,
  foreignToAud,
  lookupAtoRateForMonth,
  type TaxYearRecord,
} from '@/features/tax-position/engine'
import type { TransportKind } from '@/features/tax-position/engine/types'
import { formatAud } from '@/shared/lib/format'

const TRANSPORT_KIND_OPTIONS: { value: TransportKind | 'unspecified'; label: string }[] = [
  { value: 'unspecified', label: 'Transport' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'taxi', label: 'Taxi' },
]

type ExpensesPanelProps = {
  year: TaxYearRecord
  onChange: (year: TaxYearRecord) => void
}

export function ExpensesPanel({ year, onChange }: ExpensesPanelProps) {
  const navigate = useNavigate()

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeader
            description="Edit work claims inline — or use Quick claim to add new ones."
            title="General work expense claims"
          />
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <Button asChild className="flex-1 sm:flex-none" size="sm" variant="soft">
              <Link to="/claim">Quick claim</Link>
            </Button>
            <Button className="flex-1 sm:flex-none" size="sm" variant="outline" onClick={addWork}>
              Add claim
            </Button>
          </div>
        </div>

        {year.otherClaims.length === 0 ? (
          <EmptyState
            actionLabel="Quick claim"
            description="Multi-currency work expenses with snapshotted FX. Use Quick claim for transport, apartment, and work entry."
            secondaryAction={
              <Button size="sm" variant="ghost" onClick={addWork}>
                Add blank row
              </Button>
            }
            title="No work expenses"
            onAction={() => navigate('/claim/work')}
          />
        ) : (
          <AppCard className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">General work expenses</p>
              <p className="text-xs text-muted-foreground">
                {year.otherClaims.length} ·{' '}
                {formatAud(
                  year.otherClaims.reduce(
                    (s, c) =>
                      s +
                      foreignToAud(c.localAmount, c.exchangeRate) * (c.workPercentage / 100),
                    0,
                  ),
                )}
              </p>
            </div>
            <ul className="space-y-3">
              {year.otherClaims.map((claim, index) => {
                const aud =
                  foreignToAud(claim.localAmount, claim.exchangeRate) *
                  (claim.workPercentage / 100)
                const pendingFx =
                  claim.currencyCode !== 'AUD' && !(claim.exchangeRate > 0)

                const patch = (next: typeof claim) => {
                  const otherClaims = [...year.otherClaims]
                  otherClaims[index] = next
                  onChange({ ...year, otherClaims })
                }

                const applyAtoFx = () => {
                  const parts = /^(\d{4})-(\d{2})/.exec(claim.dateYmd ?? '')
                  const y = parts ? Number(parts[1]) : year.fyEndYear - 1
                  const m = parts ? Number(parts[2]) : 7
                  const ato = lookupAtoRateForMonth(claim.currencyCode, y, m)
                  if (!ato) return
                  patch({
                    ...claim,
                    exchangeRate: ato.unitsPerAud,
                    rateFromAto: true,
                  })
                }

                const fxNote = pendingFx
                  ? 'Pending ATO rate'
                  : claim.rateFromAto
                    ? 'ATO FX'
                    : claim.currencyCode !== 'AUD'
                      ? 'Manual FX'
                      : 'AUD'

                return (
                  <li
                    key={claim.id}
                    className="space-y-2 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                  >
                    {/* Mobile */}
                    <div className="space-y-2 lg:hidden">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                        <Input
                          aria-label="Claim date"
                          type="date"
                          value={claim.dateYmd ?? ''}
                          onChange={(e) =>
                            patch({ ...claim, dateYmd: e.target.value || undefined })
                          }
                        />
                        <p className="text-amount text-sm font-semibold">
                          {pendingFx ? 'Pending' : formatAud(aud)}
                        </p>
                      </div>
                      <Input
                        aria-label="Claim description"
                        placeholder="Work expense"
                        value={claim.description ?? ''}
                        onChange={(e) => patch({ ...claim, description: e.target.value })}
                      />
                      <p className="text-[11px] text-muted-foreground">{fxNote}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="mb-1 block text-[11px] text-muted-foreground">
                            Currency
                          </Label>
                          <Input
                            aria-label="Currency"
                            className="uppercase"
                            value={claim.currencyCode}
                            onChange={(e) =>
                              patch({
                                ...claim,
                                currencyCode: e.target.value.toUpperCase(),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-[11px] text-muted-foreground">
                            Amount
                          </Label>
                          <Input
                            aria-label="Local amount"
                            inputMode="decimal"
                            type="number"
                            value={claim.localAmount}
                            onChange={(e) =>
                              patch({ ...claim, localAmount: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-[11px] text-muted-foreground">
                            FX
                          </Label>
                          <Input
                            aria-label="FX rate"
                            inputMode="decimal"
                            type="number"
                            value={claim.exchangeRate}
                            onChange={(e) =>
                              patch({
                                ...claim,
                                exchangeRate: Number(e.target.value),
                                rateFromAto: false,
                              })
                            }
                          />
                        </div>
                      </div>
                      {claim.currencyCode !== 'AUD' ? (
                        <Button className="w-full" size="sm" variant="outline" onClick={applyAtoFx}>
                          Apply ATO FX
                        </Button>
                      ) : null}
                    </div>

                    {/* Desktop */}
                    <div className="hidden gap-2 lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)_4.25rem_5.5rem_5rem_auto]">
                      <Input
                        aria-label="Claim date"
                        type="date"
                        value={claim.dateYmd ?? ''}
                        onChange={(e) =>
                          patch({ ...claim, dateYmd: e.target.value || undefined })
                        }
                      />
                      <div className="min-w-0">
                        <Input
                          aria-label="Claim description"
                          placeholder="Work expense"
                          value={claim.description ?? ''}
                          onChange={(e) => patch({ ...claim, description: e.target.value })}
                        />
                        <p className="mt-1 text-[11px] text-muted-foreground">{fxNote}</p>
                      </div>
                      <Input
                        aria-label="Currency"
                        className="uppercase"
                        value={claim.currencyCode}
                        onChange={(e) =>
                          patch({
                            ...claim,
                            currencyCode: e.target.value.toUpperCase(),
                          })
                        }
                      />
                      <Input
                        aria-label="Local amount"
                        inputMode="decimal"
                        type="number"
                        value={claim.localAmount}
                        onChange={(e) =>
                          patch({ ...claim, localAmount: Number(e.target.value) })
                        }
                      />
                      <Input
                        aria-label="FX rate"
                        inputMode="decimal"
                        type="number"
                        value={claim.exchangeRate}
                        onChange={(e) =>
                          patch({
                            ...claim,
                            exchangeRate: Number(e.target.value),
                            rateFromAto: false,
                          })
                        }
                      />
                      <div className="flex flex-col items-end justify-center gap-1">
                        <p className="text-amount text-sm font-semibold">
                          {pendingFx ? 'Pending' : formatAud(aud)}
                        </p>
                        {claim.currencyCode !== 'AUD' ? (
                          <Button size="sm" variant="ghost" onClick={applyAtoFx}>
                            ATO FX
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </AppCard>
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
          emptyAction={{ label: 'Add airfare', to: '/claim/transport/airfares' }}
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
                !(claim.exchangeRate > 0) && claim.currencyCode !== 'AUD'
                  ? `${claim.currencyCode} ${claim.localAmount} · Pending ATO rate`
                  : claim.currencyCode !== 'AUD'
                    ? `${claim.currencyCode} ${claim.localAmount}`
                    : undefined
              }
              dateYmd={claim.dateYmd}
              description={claim.description ?? ''}
              descriptionPlaceholder="e.g. BNE–SYD for US Visa interview"
              pendingAud={!(claim.exchangeRate > 0) && claim.currencyCode !== 'AUD'}
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
          emptyAction={{ label: 'Add transport', to: '/claim/transport' }}
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
                [
                  claim.currencyCode !== 'AUD' ? `${claim.currencyCode} ${claim.localAmount}` : null,
                  !(claim.exchangeRate > 0) && claim.currencyCode !== 'AUD'
                    ? 'Pending ATO rate'
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined
              }
              dateYmd={claim.dateYmd}
              description={claim.description ?? ''}
              descriptionPlaceholder="e.g. Taxi to airport · Narita"
              pendingAud={!(claim.exchangeRate > 0) && claim.currencyCode !== 'AUD'}
              transportKind={claim.kind}
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
              onTransportKindChange={(kind) => {
                const transport = [...year.transport]
                transport[index] = { ...claim, kind }
                onChange({ ...year, transport })
              }}
            />
          ))}
        </LedgerSection>

        <LedgerSection
          count={year.carKm.length}
          empty="No car kilometre claims for this year."
          emptyAction={{ label: 'Add car km', to: '/claim/transport/car' }}
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
          emptyAction={{ label: 'Add laundry', to: '/claim/laundry' }}
          title="Laundry"
          totalAud={year.laundry.reduce((s, c) => s + foreignToAud(c.localAmount, c.exchangeRate), 0)}
        >
          {year.laundry.map((claim, index) => (
            <LedgerRow
              key={claim.id}
              amountAud={foreignToAud(claim.localAmount, claim.exchangeRate)}
              currencyNote={
                !(claim.exchangeRate > 0)
                  ? `JPY ${claim.localAmount} · Pending ATO rate`
                  : `JPY ${claim.localAmount}`
              }
              dateYmd={claim.dateYmd}
              description={claim.description ?? ''}
              descriptionPlaceholder="Laundry"
              pendingAud={!(claim.exchangeRate > 0)}
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
          emptyAction={{ label: 'Add apartment cost', to: '/claim/apartment' }}
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
              currencyNote={
                !(claim.exchangeRate > 0)
                  ? `JPY ${claim.localAmount} · Pending ATO rate`
                  : `JPY ${claim.localAmount}`
              }
              dateYmd={claim.dateYmd}
              description={claim.description ?? claim.kind}
              descriptionPlaceholder={claim.kind}
              pendingAud={!(claim.exchangeRate > 0)}
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
  emptyAction,
  count,
  totalAud,
  children,
}: {
  title: string
  empty: string
  emptyAction?: { label: string; to: string }
  count: number
  totalAud: number
  children: ReactNode
}) {
  if (count === 0) {
    return (
      <AppCard className="space-y-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{empty}</p>
        {emptyAction ? (
          <Button asChild size="sm" variant="soft">
            <Link to={emptyAction.to}>{emptyAction.label}</Link>
          </Button>
        ) : null}
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
  pendingAud,
  transportKind,
  onDateChange,
  onDescriptionChange,
  onTransportKindChange,
}: {
  dateYmd?: string
  description: string
  descriptionPlaceholder: string
  amountAud: number
  currencyNote?: string
  pendingAud?: boolean
  transportKind?: TransportKind
  onDateChange: (dateYmd: string) => void
  onDescriptionChange: (description: string) => void
  onTransportKindChange?: (kind: TransportKind | undefined) => void
}) {
  const amount = (
    <p className="text-amount self-center text-sm font-semibold sm:text-right">
      {pendingAud ? 'Pending' : formatAud(amountAud)}
    </p>
  )

  const meta = onTransportKindChange || currencyNote ? (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
      {onTransportKindChange ? (
        <Select
          value={transportKind ?? 'unspecified'}
          onValueChange={(value) => {
            onTransportKindChange(
              value === 'unspecified' ? undefined : (value as TransportKind),
            )
          }}
        >
          <SelectTrigger
            aria-label="Transport type"
            className="h-9 min-h-9 w-auto min-w-[5.75rem] gap-1 border-border/60 bg-muted/40 px-2 text-xs font-medium text-muted-foreground shadow-none"
          >
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TRANSPORT_KIND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {currencyNote ? (
        <p className="text-[11px] text-muted-foreground">{currencyNote}</p>
      ) : null}
    </div>
  ) : null

  return (
    <li className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
      {/* Mobile: date + amount, then description */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:hidden">
        <div className="min-w-0">
          <Label className="sr-only">Date</Label>
          <Input
            aria-label="Claim date"
            type="date"
            value={dateYmd ?? ''}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
        {amount}
        <div className="col-span-2 min-w-0">
          <Label className="sr-only">Description</Label>
          <Input
            aria-label="Claim description"
            placeholder={descriptionPlaceholder}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
          {meta}
        </div>
      </div>

      {/* sm+: date | description | amount */}
      <div className="hidden gap-2 sm:grid sm:grid-cols-[9rem_1fr_auto]">
        <div>
          <Label className="sr-only">Date</Label>
          <Input
            aria-label="Claim date"
            type="date"
            value={dateYmd ?? ''}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
        <div className="min-w-0">
          <Label className="sr-only">Description</Label>
          <Input
            aria-label="Claim description"
            placeholder={descriptionPlaceholder}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
          {meta}
        </div>
        {amount}
      </div>
    </li>
  )
}
