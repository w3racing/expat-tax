import { Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { Button } from '@/shared/components/ui/button'
import { ErrorBanner } from '@/shared/components/ui/error-banner'
import { PageSkeleton } from '@/shared/components/ajx/loading-states'

export function AuthPage() {
  const { user, loading, isLocalMode, signInWithGoogle, signInLocal } = useAuth()
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col justify-center overflow-y-auto px-6">
        <PageSkeleton cards={2} />
      </div>
    )
  }

  if (user) {
    return <Navigate replace to="/" />
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center gap-8 overflow-y-auto px-6 py-12">
      <div>
        <p className="font-display text-3xl font-semibold tracking-tight text-foreground">AJX Tax</p>
        <p className="mt-3 text-base text-muted-foreground">
          Your tax position, organised throughout the year — evidence linked, summaries indicative,
          ready for your accountant.
        </p>
      </div>

      {isLocalMode ? (
        <SoftBanner tone="info">
          <strong className="font-semibold">Local development mode.</strong> Supabase env vars are not
          set — continue locally to develop MVP features.
        </SoftBanner>
      ) : (
        <SoftBanner tone="info">
          Sign in with Google to sync securely. Demo / local bypass is disabled when cloud auth is
          configured.
        </SoftBanner>
      )}

      {error ? (
        <ErrorBanner
          code="AUTH_FAILED"
          onAction={() => setError(false)}
          onDismiss={() => setError(false)}
        />
      ) : null}

      <div className="flex flex-col gap-3">
        {!isLocalMode ? (
          <Button
            disabled={busy}
            size="lg"
            onClick={() => {
              setBusy(true)
              void signInWithGoogle().catch(() => {
                setError(true)
                setBusy(false)
              })
            }}
          >
            Continue with Google
          </Button>
        ) : (
          <Button
            disabled={busy}
            size="lg"
            onClick={() => {
              setBusy(true)
              void signInLocal().finally(() => setBusy(false))
            }}
          >
            Continue locally
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        AJX Tax does not lodge returns or give personalised tax advice. Figures are indicative working
        papers.
      </p>
    </div>
  )
}
