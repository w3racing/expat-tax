import { Link } from 'react-router-dom'
import { useRef, useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { useFy, fyLabel as formatFyLabel } from '@/app/providers/fy-provider'
import { useTheme } from '@/app/providers/theme-provider'
import {
  downloadAppBackup,
  readBackupFile,
  restoreAppBackup,
  type AppBackupSummary,
} from '@/features/backup/services/app-backup'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { isSupabaseConfigured } from '@/shared/lib/supabase'

export function SettingsPage() {
  const { user, signOut, isLocalMode } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { fyEndYear, label, availableYears, setFyEndYear, createOrSelectFy } = useFy()
  const [newFyEnd, setNewFyEnd] = useState(String(fyEndYear + 1))
  const [fyError, setFyError] = useState<string | null>(null)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [pendingRestore, setPendingRestore] = useState<{
    summary: AppBackupSummary
    file: File
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  const onBackup = () => {
    const summary = downloadAppBackup(fyEndYear)
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
      const summary = restoreAppBackup(backup)
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
        description="Financial year, backup, account, and appearance. Advanced automation is deferred until MVP is complete."
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
        <p className="text-sm font-semibold">Backup & restore</p>
        <p className="text-sm text-muted-foreground">
          Full MVP backup includes Tax Position, overnight counts, sample days with receipts, and
          evidence metadata (plus local files when present).
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
          <Link to="/export">Accountant export</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/migration">Import Calculator backup</Link>
        </Button>
      </AppCard>

      <AppCard className="space-y-2">
        <p className="text-sm font-semibold">Account</p>
        <p className="text-sm text-muted-foreground">
          {user?.displayName} · {user?.email}
        </p>
        <p className="text-xs text-muted-foreground">
          {isLocalMode || !isSupabaseConfigured
            ? 'Local mode — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for cloud auth.'
            : 'Signed in via Supabase.'}
        </p>
        <Button variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
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
