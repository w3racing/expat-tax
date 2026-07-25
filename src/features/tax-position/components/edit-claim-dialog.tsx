import { useEffect, useMemo, useState } from 'react'
import { claimAud, foreignToAud } from '@/features/tax-position/engine'
import {
  carKmRemainingExcluding,
  claimFormConfigForFound,
  findClaimById,
  updateClaimById,
} from '@/features/quick-claim/utils/add-claim'
import { resolveFxForClaim } from '@/features/quick-claim/utils/resolve-fx'
import type { ClaimCurrency } from '@/features/quick-claim/config/claim-catalog'
import type { TaxYearRecord } from '@/features/tax-position/engine/types'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { ErrorBanner } from '@/shared/components/ui/error-banner'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { formatAud, formatNumber } from '@/shared/lib/format'
import { DEFAULT_CENTS_PER_KM_FY2026 } from '@/features/tax-position/engine/constants'

type EditClaimDialogProps = {
  open: boolean
  claimId: string | null
  year: TaxYearRecord
  onOpenChange: (open: boolean) => void
  onSave: (next: TaxYearRecord) => void
}

export function EditClaimDialog({
  open,
  claimId,
  year,
  onOpenChange,
  onSave,
}: EditClaimDialogProps) {
  const found = claimId ? findClaimById(year, claimId) : null
  const config = found ? claimFormConfigForFound(found) : null

  const [dateYmd, setDateYmd] = useState('')
  const [description, setDescription] = useState('')
  const [currencyCode, setCurrencyCode] = useState<ClaimCurrency>('JPY')
  const [localAmount, setLocalAmount] = useState('')
  const [kilometres, setKilometres] = useState('')
  const [manualRate, setManualRate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !claimId) return
    const next = findClaimById(year, claimId)
    if (!next) return
    const nextConfig = claimFormConfigForFound(next)

    setDateYmd(next.claim.dateYmd ?? '')
    setDescription(next.claim.description ?? nextConfig.defaultDescription ?? '')
    setFormError(null)

    if (next.ledger === 'carKm') {
      setKilometres(String(next.claim.kilometres))
      setLocalAmount('')
      setManualRate('')
      setCurrencyCode('AUD')
      return
    }

    setKilometres('')
    setLocalAmount(String(next.claim.localAmount))

    if (next.ledger === 'laundry' || next.ledger === 'apartmentCosts') {
      setCurrencyCode('JPY')
    } else {
      const code = next.claim.currencyCode.toUpperCase()
      setCurrencyCode(
        (nextConfig.currencies.includes(code as ClaimCurrency)
          ? code
          : nextConfig.defaultCurrency) as ClaimCurrency,
      )
    }

    const rate = next.claim.exchangeRate
    const fromAto = next.claim.rateFromAto
    if (rate > 0 && !fromAto) {
      setManualRate(String(rate))
    } else {
      setManualRate('')
    }
    // Hydrate once when the dialog opens for a claim; ignore year churn while editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open/claimId gate
  }, [open, claimId])

  const fx = useMemo(() => resolveFxForClaim(currencyCode, dateYmd), [currencyCode, dateYmd])

  const exchangeRate = useMemo(() => {
    if (manualRate.trim()) {
      const n = Number(manualRate)
      return n > 0 ? n : 0
    }
    return fx.exchangeRate
  }, [manualRate, fx.exchangeRate])

  const amountPreviewAud = useMemo(() => {
    const amount = Number(localAmount)
    if (!(amount > 0) || !(exchangeRate > 0)) return 0
    if (config?.ledger === 'apartmentCosts' || config?.ledger === 'laundry') {
      return foreignToAud(amount, exchangeRate)
    }
    return claimAud(amount, exchangeRate, 100)
  }, [localAmount, exchangeRate, config?.ledger])

  const carRemaining = useMemo(() => {
    if (!claimId) return 0
    return carKmRemainingExcluding(year, claimId)
  }, [year, claimId])

  const carClaimableKm = useMemo(() => {
    const km = Number(kilometres)
    if (!(km > 0)) return 0
    return Math.min(km, carRemaining)
  }, [kilometres, carRemaining])

  const carPreviewAud = (carClaimableKm * DEFAULT_CENTS_PER_KM_FY2026) / 100

  const awaitingAto =
    config?.mode !== 'car-km' &&
    currencyCode !== 'AUD' &&
    fx.missingAtoRate &&
    !manualRate.trim()

  const canSave =
    Boolean(dateYmd) &&
    (config?.mode === 'car-km'
      ? Number(kilometres) > 0
      : Number(localAmount) > 0 &&
        (exchangeRate > 0 || awaitingAto || currencyCode === 'AUD'))

  const submit = () => {
    if (!claimId || !found || !config) return
    setFormError(null)

    if (config.mode === 'car-km') {
      const km = Number(kilometres)
      if (!(km > 0)) {
        setFormError('Enter kilometres travelled.')
        return
      }
      onSave(
        updateClaimById(year, claimId, {
          dateYmd,
          description,
          kilometres: km,
        }),
      )
      onOpenChange(false)
      return
    }

    const amount = Number(localAmount)
    if (!(amount > 0)) {
      setFormError('Enter an amount greater than zero.')
      return
    }
    const pendingAto = currencyCode !== 'AUD' && fx.missingAtoRate && !manualRate.trim()
    if (!(exchangeRate > 0) && !pendingAto && currencyCode !== 'AUD') {
      setFormError('Enter an exchange rate, or leave blank to wait for the ATO monthly rate.')
      return
    }

    onSave(
      updateClaimById(year, claimId, {
        dateYmd,
        description,
        currencyCode:
          found.ledger === 'laundry' || found.ledger === 'apartmentCosts'
            ? undefined
            : currencyCode,
        localAmount: amount,
        exchangeRate: pendingAto ? 0 : exchangeRate,
        rateFromAto: pendingAto || (!manualRate.trim() && fx.rateFromAto),
      }),
    )
    onOpenChange(false)
  }

  if (!open) return null

  if (!found || !config) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit claim</DialogTitle>
            <DialogDescription>This claim could not be found.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {config.title.toLowerCase()}</DialogTitle>
          <DialogDescription>
            Update the date, description, or amounts. Changes appear on your tax position straight
            away.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-claim-date">Date</Label>
            <Input
              id="edit-claim-date"
              type="date"
              value={dateYmd}
              onChange={(e) => setDateYmd(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="edit-claim-description">Description</Label>
            <Input
              id="edit-claim-description"
              placeholder={config.defaultDescription}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {config.mode === 'car-km' ? (
            <>
              <div>
                <Label htmlFor="edit-claim-km">Kilometres</Label>
                <Input
                  id="edit-claim-km"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  type="number"
                  value={kilometres}
                  onChange={(e) => setKilometres(e.target.value)}
                />
              </div>
              <div className="rounded-lg bg-muted/60 px-3 py-3 text-sm">
                <p className="text-muted-foreground">
                  ATO rate · {DEFAULT_CENTS_PER_KM_FY2026}¢ per km · {formatNumber(carRemaining)} km
                  remaining this year
                </p>
                <p className="mt-1 text-amount text-base font-semibold text-foreground">
                  Claimable {formatAud(carPreviewAud)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-claim-currency">Currency</Label>
                  {config.currencies.length === 1 ? (
                    <Input id="edit-claim-currency" readOnly value={config.currencies[0]} />
                  ) : (
                    <Select
                      value={currencyCode}
                      onValueChange={(v) => {
                        setCurrencyCode(v as ClaimCurrency)
                        setManualRate('')
                      }}
                    >
                      <SelectTrigger id="edit-claim-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.currencies.map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-claim-amount">Amount</Label>
                  <Input
                    id="edit-claim-amount"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    type="number"
                    value={localAmount}
                    onChange={(e) => setLocalAmount(e.target.value)}
                  />
                </div>
              </div>

              {currencyCode !== 'AUD' ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-claim-fx">Exchange rate (units per A$1)</Label>
                  <Input
                    id="edit-claim-fx"
                    inputMode="decimal"
                    min={0}
                    step="0.0001"
                    type="number"
                    value={manualRate || (fx.exchangeRate > 0 ? String(fx.exchangeRate) : '')}
                    onChange={(e) => setManualRate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {fx.rateFromAto && !manualRate.trim()
                      ? 'ATO monthly average for the claim month.'
                      : fx.missingAtoRate && !manualRate.trim()
                        ? 'No ATO rate yet — you can still save. Refresh later in Settings, or enter a rate now.'
                        : 'Manual rate snapshot.'}
                  </p>
                </div>
              ) : null}

              {awaitingAto ? (
                <SoftBanner tone="info">
                  Saves with AUD pending. Use Settings → Refresh ATO rates when the month is
                  published.
                </SoftBanner>
              ) : null}

              <div className="rounded-lg bg-muted/60 px-3 py-3 text-sm">
                <p className="text-muted-foreground">AUD claim</p>
                <p className="text-amount text-base font-semibold">
                  {awaitingAto ? 'Pending ATO rate' : formatAud(amountPreviewAud)}
                </p>
              </div>
            </>
          )}

          {formError ? <ErrorBanner description={formError} title="Check this claim" /> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSave} type="button" onClick={submit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
