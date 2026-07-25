import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { useFy, fyLabel as formatFyLabel } from '@/app/providers/fy-provider'
import { useTheme } from '@/app/providers/theme-provider'
import {
  downloadAppBackup,
  readBackupFile,
  restoreAppBackup,
  type AppBackupSummary,
} from '@/features/backup/services/app-backup'
import { useTaxPosition } from '@/features/tax-position'
import { refreshAtoRatesOnPlanner } from '@/features/tax-position/services/refresh-ato-rates'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { Button } from '@/shared/components/ui/button'
import { DraftStatus, type DraftSaveState } from '@/shared/components/ui/draft-status'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { isSupabaseConfigured } from '@/shared/lib/supabase'

export function SettingsPage() {
  const { user, signOut, isLocalMode, updateProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { fyEndYear, label, availableYears, setFyEndYear, createOrSelectFy } = useFy()
  const { planner, persistPlanner, draftState } = useTaxPosition()
  const [newFyEnd, setNewFyEnd] = useState(String(fyEndYear + 1))
  const [fyError, setFyError] = useState<string | null>(null)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [fxMessage, setFxMessage] = useState<string | null>(null)
  const [refreshingFx, setRefreshingFx] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileDraft, setProfileDraft] = useState<DraftSaveState>('idle')
  const [pendingRestore, setPendingRestore] = useState<{
    summary: AppBackupSummary
    file: File
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplayName(user?.displayName ?? '')
    setEmail(user?.email ?? '')
  }, [user?.displayName, user?.email])

  const profileDirty =
    displayName.trim() !== (user?.displayName ?? '').trim() ||
    (isLocalMode && email.trim() !== (user?.email ?? '').trim())

  const onSaveProfile = async () => {
    setProfileError(null)
    setProfileDraft('saving')
    try {
      await updateProfile({ displayName, email })
      setProfileDraft('saved')
    } catch (err) {
      setProfileDraft('error')
      setProfileError(err instanceof Error ? err.message : 'Could not save your details.')
    }
  }

  const onCreateFy = () => {
    setFyError(null)
    const year = Number(newFyEnd)
    try {
      createOrSelectFy(year)
      setBackupMessage(`Active year is now ${formatFyLabel(year)}.`)
    } catch (err) {
      setFyError(err instanceof Error ? err.message : 'Could not create that year.')
    }
  }

  const onRefreshAtoRates = () => {
    setRefreshingFx(true)
    setFxMessage(null)
    try {
      const { planner: next, summary } = refreshAtoRatesOnPlanner(planner)
      persistPlanner(next, 'recompute')
      const updated =
        summary.claimRowsUpdated +
        summary.incomeRowsUpdated +
        summary.sampleReceiptsUpdated
      if (updated === 0 && summary.pendingStillMissing === 0) {
        setFxMessage('No ATO-tracked rates needed updating.')
      } else {
        const parts = [
          summary.claimRowsUpdated
            ? `${summary.claimRowsUpdated} claim${summary.claimRowsUpdated === 1 ? '' : 's'}`
            : null,
          summary.incomeRowsUpdated
            ? `${summary.incomeRowsUpdated} income month${summary.incomeRowsUpdated === 1 ? '' : 's'}`
            : null,
          summary.sampleReceiptsUpdated
            ? `${summary.sampleReceiptsUpdated} sample receipt${summary.sampleReceiptsUpdated === 1 ? '' : 's'}`
            : null,
        ].filter(Boolean)
        const applied = parts.length > 0 ? `Updated ${parts.join(' · ')}.` : 'No rows updated.'
        const pending =
          summary.pendingStillMissing > 0
            ? ` ${summary.pendingStillMissing} still waiting on a published ATO month.`
            : ''
        setFxMessage(`${applied}${pending}`)
      }
    } catch (err) {
      setFxMessage(err instanceof Error ? err.message : 'Could not refresh ATO rates.')
    } finally {
      setRefreshingFx(false)
    }
  }

  const onBackup = async () => {
    const summary = await downloadAppBackup(fyEndYear)
    setBackupMessage(
      `Backup downloaded · ${summary.sampleDayCount} sample days · ${summary.evidenceCount} documents · ${summary.fyYears.length} year(s).`,
    )
  }

  const onPickRestore = async (file: File | null) => {
    if (!file) return
    try {
      const backup = await readBackupFile(file)
      setPendingRestore({
        file,
        summary: {
          fyYears: backup.planner.years.map((y) => y.fyEndYear).sort((a, b) => b - a),
          destinationCount: backup.planner.destinations.length,
          overnightRows: backup.planner.years.reduce((n, y) => n + y.monthAway.length, 0),
          sampleDayCount: backup.sampleDays.length,
          evidenceCount: backup.evidence.length,
          exportedAt: backup.exportedAt,
        },
      })
    } catch (err) {
      setBackupMessage(err instanceof Error ? err.message : 'Could not read backup.')
      setPendingRestore(null)
    }
  }

  const confirmRestore = async () => {
    if (!pendingRestore) return
    try {
      const backup = await readBackupFile(pendingRestore.file)
      const summary = await restoreAppBackup(backup)
      setFyEndYear(backup.activeFyEndYear)
      setPendingRestore(null)
      setBackupMessage(
        `Restored · ${summary.sampleDayCount} sample days · ${summary.evidenceCount} documents. Reload if screens look stale.`,
      )
      window.setTimeout(() => window.location.reload(), 600)
    } catch (err) {
      setBackupMessage(err instanceof Error ? err.message : 'Restore failed.')
      setPendingRestore(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Financial year, ATO FX, audit package, accountant export, backup, account, and appearance."
        title="Settings"
      />

      <AppCard className="space-y-4">
        <p className="text-sm font-semibold">Financial year</p>
        <p className="text-sm text-muted-foreground">
          Active: <span className="font-medium text-foreground">{label}</span> (year ending 30 June{' '}
          {fyEndYear})
        </p>
        <div className="flex flex-wrap gap-2">
          {availableYears.map((year) => (
            <Button
              key={year}
              size="sm"
              variant={year === fyEndYear ? 'default' : 'outline'}
              onClick={() => setFyEndYear(year)}
            >
              {formatFyLabel(year)}
            </Button>
          ))}
        </div>
        <div className="grid max-w-sm gap-2">
          <Label htmlFor="new-fy">Create year ending</Label>
          <div className="flex gap-2">
            <Input
              id="new-fy"
              inputMode="numeric"
              value={newFyEnd}
              onChange={(e) => setNewFyEnd(e.target.value)}
            />
            <Button type="button" onClick={onCreateFy}>
              Create
            </Button>
          </div>
          {fyError ? <p className="text-sm text-destructive">{fyError}</p> : null}
        </div>
      </AppCard>

      <AppCard className="space-y-3">
        <p className="text-sm font-semibold">ATO exchange rates</p>
        <p className="text-sm text-muted-foreground">
          Apply published ATO monthly averages to claims and income that are waiting on a rate, or
          already marked as ATO-tracked. Manual rates are left alone.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="w-full sm:w-auto"
            disabled={refreshingFx}
            variant="soft"
            onClick={onRefreshAtoRates}
          >
            {refreshingFx ? 'Refreshing…' : 'Refresh ATO rates'}
          </Button>
          {draftState === 'saved' || draftState === 'saving' ? (
            <span className="text-xs text-muted-foreground">
              {draftState === 'saving' ? 'Saving…' : 'Saved'}
            </span>
          ) : null}
        </div>
        {fxMessage ? <p className="text-sm text-muted-foreground">{fxMessage}</p> : null}
        <Button asChild variant="ghost">
          <Link to="/position?section=advanced-fx">View ATO FX table</Link>
        </Button>
      </AppCard>

      <AppCard className="space-y-3">
        <p className="text-sm font-semibold">ATO Audit Package</p>
        <p className="text-sm text-muted-foreground">
          Audit readiness for the active year, then generate an Audit Report PDF and sectioned
          evidence ZIP suitable for your tax agent or an ATO information request.
        </p>
        <Button asChild variant="soft">
          <Link to="/settings/audit">Open Audit Package</Link>
        </Button>
      </AppCard>

      <AppCard className="space-y-3">
        <p className="text-sm font-semibold">Accountant export</p>
        <p className="text-sm text-muted-foreground">
          Once a year — generate a PDF summary and supporting ZIP for your registered tax agent.
        </p>
        <Button asChild variant="soft">
          <Link to="/export">Open accountant export</Link>
        </Button>
      </AppCard>

      <AppCard className="space-y-3">
        <p className="text-sm font-semibold">Backup & restore</p>
        <p className="text-sm text-muted-foreground">
          Occasional use — full backup of Tax Position, overnight counts, sample days, and evidence.
          Import a Calculator backup when migrating.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" onClick={onBackup}>
            Download backup
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Restore from backup
          </Button>
          <input
            ref={fileRef}
            accept="application/json,.json"
            className="hidden"
            type="file"
            onChange={(e) => void onPickRestore(e.target.files?.[0] ?? null)}
          />
        </div>
        {backupMessage ? <p className="text-sm text-muted-foreground">{backupMessage}</p> : null}
        <Button asChild variant="ghost">
          <Link to="/migration">Import Calculator backup</Link>
        </Button>
      </AppCard>

      <AppCard className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">Account</p>
          <DraftStatus state={profileDraft} />
        </div>
        <p className="text-sm text-muted-foreground">
          Used on accountant exports and shown in the app. {isLocalMode
            ? 'Stored on this device until cloud sign-in is set up.'
            : 'Name syncs with your Google account profile.'}
        </p>
        <div className="grid max-w-md gap-3">
          <div className="grid gap-2">
            <Label htmlFor="account-name">Name</Label>
            <Input
              autoComplete="name"
              id="account-name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                setProfileDraft('idle')
                setProfileError(null)
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="account-email">Email</Label>
            <Input
              autoComplete="email"
              id="account-email"
              inputMode="email"
              readOnly={!isLocalMode}
              type="email"
              value={email}
              onChange={(e) => {
                if (!isLocalMode) return
                setEmail(e.target.value)
                setProfileDraft('idle')
                setProfileError(null)
              }}
            />
            {!isLocalMode ? (
              <p className="text-xs text-muted-foreground">Email comes from your Google sign-in.</p>
            ) : null}
          </div>
          {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={!profileDirty || profileDraft === 'saving'}
              type="button"
              onClick={() => void onSaveProfile()}
            >
              Save details
            </Button>
            <Button variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </div>
        {isLocalMode || !isSupabaseConfigured ? (
          <p className="text-xs text-muted-foreground">
            Local mode — cloud sync is optional and not required for the MVP.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Signed in via Supabase.</p>
        )}
      </AppCard>

      <AppCard className="space-y-3">
        <p className="text-sm font-semibold">Appearance</p>
        <Button variant="soft" onClick={toggleTheme}>
          Switch to {theme === 'dark' ? 'light' : 'dark'} mode
        </Button>
      </AppCard>

      <AppCard className="space-y-2">
        <p className="text-sm font-semibold">Coming later</p>
        <SoftBanner tone="info">
          Google Drive sync, AI / OCR, and roster interpretation are deferred until this MVP loop is
          complete and polished. Do not rely on them yet.
        </SoftBanner>
        <Button asChild variant="ghost">
          <Link to="/settings/migration">Migration admin</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/design-system">Design system</Link>
        </Button>
      </AppCard>

      <ConfirmDialog
        confirmLabel="Replace all data"
        description={
          pendingRestore
            ? `This replaces Tax Position, sample days, and evidence with the backup from ${new Date(pendingRestore.summary.exportedAt).toLocaleString()}. ${pendingRestore.summary.sampleDayCount} sample days · ${pendingRestore.summary.evidenceCount} documents · ${pendingRestore.summary.fyYears.length} year(s). This cannot be undone.`
            : ''
        }
        destructive
        open={pendingRestore != null}
        title="Restore backup?"
        typingGate="RESTORE"
        onCancel={() => setPendingRestore(null)}
        onConfirm={() => void confirmRestore()}
      />
    </div>
  )
}
