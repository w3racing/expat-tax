import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTaxPosition } from '@/features/tax-position'
import { claimAud, foreignToAud } from '@/features/tax-position/engine'
import { uploadEvidence } from '@/features/evidence/services/evidence-vault'
import type { ClaimFormConfig } from '@/features/quick-claim/config/claim-catalog'
import { ClaimEvidenceField } from '@/features/quick-claim/components/claim-evidence-field'
import {
  appendClaimFromForm,
  carKmClaimableForEntry,
  removeClaimById,
} from '@/features/quick-claim/utils/add-claim'
import { resolveFxForClaim } from '@/features/quick-claim/utils/resolve-fx'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { AppCard } from '@/shared/components/ajx/app-card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { DraftStatus } from '@/shared/components/ui/draft-status'
import { ErrorBanner } from '@/shared/components/ui/error-banner'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { useUndoToast } from '@/shared/components/ui/undo-toast'
import type { UploadPhase } from '@/shared/components/ui/upload-status'
import { formatAud, formatNumber } from '@/shared/lib/format'
import type { ClaimCurrency } from '@/features/quick-claim/config/claim-catalog'

type ClaimFormViewProps = {
  config: ClaimFormConfig
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

const LEDGER_TO_SECTION: Record<ClaimFormConfig['ledger'], string> = {
  flights: 'flights',
  transport: 'transport',
  carKm: 'car-km',
  apartmentCosts: 'apartment',
  otherClaims: 'other-claims',
  laundry: 'laundry',
}

function positionAfterClaim(config: ClaimFormConfig) {
  return `/position?section=${LEDGER_TO_SECTION[config.ledger]}`
}

export function ClaimFormView({ config }: ClaimFormViewProps) {
  const navigate = useNavigate()
  const { fyEndYear, year, draftState, persistYear } = useTaxPosition()
  const { showUndo } = useUndoToast()

  const [dateYmd, setDateYmd] = useState(todayYmd)
  const [description, setDescription] = useState(config.defaultDescription ?? '')
  const [currencyCode, setCurrencyCode] = useState<ClaimCurrency>(config.defaultCurrency)
  const [localAmount, setLocalAmount] = useState('')
  const [kilometres, setKilometres] = useState('')
  const [manualRate, setManualRate] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setDescription(config.defaultDescription ?? '')
    setCurrencyCode(config.defaultCurrency)
    setLocalAmount('')
    setKilometres('')
    setManualRate('')
    setEvidenceFile(null)
    setUploadPhase('idle')
    setUploadError(null)
    setFormError(null)
  }, [config])

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
    if (config.ledger === 'apartmentCosts' || config.ledger === 'laundry') {
      return foreignToAud(amount, exchangeRate)
    }
    return claimAud(amount, exchangeRate, 100)
  }, [localAmount, exchangeRate, config.ledger])

  const carPreview = useMemo(() => {
    const km = Number(kilometres)
    if (!(km > 0)) return carKmClaimableForEntry(year, 0)
    return carKmClaimableForEntry(year, km)
  }, [kilometres, year])

  const awaitingAto =
    currencyCode !== 'AUD' && fx.missingAtoRate && !manualRate.trim()

  const canSubmitAmount =
    Boolean(dateYmd) &&
    Number(localAmount) > 0 &&
    (exchangeRate > 0 || awaitingAto || currencyCode === 'AUD') &&
    !submitting
  const canSubmitCar = Boolean(dateYmd) && Number(kilometres) > 0 && !submitting

  const submit = async () => {
    setFormError(null)
    setUploadError(null)

    if (config.mode === 'car-km') {
      const km = Number(kilometres)
      if (!(km > 0)) {
        setFormError('Enter kilometres travelled.')
        return
      }
      setSubmitting(true)
      try {
        const { year: next, claimId } = appendClaimFromForm(year, config, {
          dateYmd,
          description,
          kilometres: km,
        })
        persistYear(next)
        showUndo({
          message: 'Car kilometres claim added',
          onUndo: () => persistYear(removeClaimById(next, claimId)),
        })
        navigate(positionAfterClaim(config))
      } finally {
        setSubmitting(false)
      }
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

    setSubmitting(true)
    const claimId = crypto.randomUUID()
    let evidenceVersionId: string | null = null

    try {
      if (config.showEvidence && evidenceFile) {
        setUploadPhase('uploading')
        try {
          const record = await uploadEvidence({
            file: evidenceFile,
            category: config.evidenceCategory,
            fyEndYear,
            documentDate: dateYmd || null,
            monthKey: null,
            description: description.trim() || config.title,
            tags: [],
            linkedClaimId: claimId,
            linkedClaimLabel: [dateYmd, description.trim() || config.title]
              .filter(Boolean)
              .join(' · '),
            destinationId: null,
            destinationName: null,
          })
          evidenceVersionId = record.id
          setUploadPhase('ready')
        } catch (err) {
          setUploadPhase('failed')
          setUploadError(err instanceof Error ? err.message : 'Upload failed. Try again.')
          return
        }
      }

      const { year: next } = appendClaimFromForm(
        year,
        config,
        {
          dateYmd,
          description,
          currencyCode,
          localAmount: amount,
          exchangeRate: pendingAto ? 0 : exchangeRate,
          rateFromAto: pendingAto || (!manualRate.trim() && fx.rateFromAto),
          evidenceVersionId,
        },
        claimId,
      )

      persistYear(next)
      showUndo({
        message: pendingAto
          ? `${config.title} saved — AUD pending ATO rate`
          : `${config.title} claim added`,
        onUndo: () => persistYear(removeClaimById(next, claimId)),
      })
      navigate(positionAfterClaim(config))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-4 md:pb-0">
      <div className="space-y-2">
        <Button asChild className="-ml-2" size="sm" variant="ghost">
          <Link to={config.backTo}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <PageHeader
          actions={<DraftStatus state={draftState} />}
          className="gap-2"
          description={config.description}
          title={config.title}
        />
      </div>

      <AppCard className="space-y-4">
        <div>
          <Label htmlFor="claim-date">Date</Label>
          <Input
            id="claim-date"
            type="date"
            value={dateYmd}
            onChange={(e) => setDateYmd(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="claim-description">Description</Label>
          <Input
            id="claim-description"
            placeholder={config.defaultDescription}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {config.mode === 'car-km' ? (
          <>
            <div>
              <Label htmlFor="claim-km">Kilometres</Label>
              <Input
                id="claim-km"
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
                ATO rate · {carPreview.centsPerKm}¢ per km ·{' '}
                {formatNumber(carPreview.remainingBefore)} km remaining this year
              </p>
              <p className="mt-1 text-amount text-base font-semibold text-foreground">
                Claimable {formatAud(carPreview.amountAud)}
                {Number(kilometres) > carPreview.claimableKm ? (
                  <span className="mt-1 block text-xs font-normal text-muted-foreground sm:ml-2 sm:mt-0 sm:inline">
                    ({formatNumber(carPreview.claimableKm)} of {formatNumber(Number(kilometres))} km)
                  </span>
                ) : null}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="claim-currency">Currency</Label>
                {config.currencies.length === 1 ? (
                  <Input id="claim-currency" readOnly value={config.currencies[0]} />
                ) : (
                  <Select
                    value={currencyCode}
                    onValueChange={(v) => {
                      setCurrencyCode(v as ClaimCurrency)
                      setManualRate('')
                    }}
                  >
                    <SelectTrigger id="claim-currency">
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
                <Label htmlFor="claim-amount">Amount</Label>
                <Input
                  id="claim-amount"
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
                <Label htmlFor="claim-fx">Exchange rate (units per A$1)</Label>
                <Input
                  id="claim-fx"
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
                Saves with AUD pending. Use Settings → Refresh ATO rates when the month is published.
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

        {config.showEvidence ? (
          <ClaimEvidenceField
            errorMessage={uploadError}
            file={evidenceFile}
            phase={uploadPhase}
            onFileChange={(file) => {
              setEvidenceFile(file)
              setUploadPhase('idle')
              setUploadError(null)
            }}
            onRetry={() => {
              setUploadPhase('idle')
              setUploadError(null)
            }}
          />
        ) : null}

        {formError ? <ErrorBanner description={formError} title="Check this claim" /> : null}
      </AppCard>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-1 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-lg gap-2 px-3 md:px-0">
          <Button
            className="flex-1 md:flex-none"
            disabled={config.mode === 'car-km' ? !canSubmitCar : !canSubmitAmount}
            type="button"
            onClick={() => void submit()}
          >
            {submitting ? 'Saving…' : 'Save claim'}
          </Button>
          <Button asChild className="md:inline-flex" type="button" variant="ghost">
            <Link to={config.backTo}>Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
