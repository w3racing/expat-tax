import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from '@/app/providers/app-providers'
import { AppShell } from '@/app/layouts/app-shell'
import { RequireAuth } from '@/app/layouts/require-auth'
import { AuthPage } from '@/features/auth'
import { PageSkeleton } from '@/shared/components/ajx/loading-states'

const DashboardPage = lazy(() =>
  import('@/features/dashboard').then((m) => ({ default: m.DashboardPage })),
)
const OvernightPlannerPage = lazy(() =>
  import('@/features/overnight-planner').then((m) => ({ default: m.OvernightPlannerPage })),
)
const DestinationWorkspacePage = lazy(() =>
  import('@/features/destination-workspace').then((m) => ({
    default: m.DestinationWorkspacePage,
  })),
)
const SampleDaysPage = lazy(() =>
  import('@/features/destination-workspace').then((m) => ({ default: m.SampleDaysPage })),
)
const SampleDayDetailPage = lazy(() =>
  import('@/features/destination-workspace').then((m) => ({ default: m.SampleDayDetailPage })),
)
const TaxPositionPage = lazy(() =>
  import('@/features/tax-position').then((m) => ({ default: m.TaxPositionPage })),
)
const TaxSummaryPage = lazy(() =>
  import('@/features/tax-position').then((m) => ({ default: m.TaxSummaryPage })),
)
const QuickClaimHubPage = lazy(() =>
  import('@/features/quick-claim').then((m) => ({ default: m.QuickClaimHubPage })),
)
const TransportMenuPage = lazy(() =>
  import('@/features/quick-claim').then((m) => ({ default: m.TransportMenuPage })),
)
const ApartmentMenuPage = lazy(() =>
  import('@/features/quick-claim').then((m) => ({ default: m.ApartmentMenuPage })),
)
const DestinationsMenuPage = lazy(() =>
  import('@/features/quick-claim').then((m) => ({ default: m.DestinationsMenuPage })),
)
const ClaimFormPage = lazy(() =>
  import('@/features/quick-claim').then((m) => ({ default: m.ClaimFormPage })),
)
const EvidencePage = lazy(() =>
  import('@/features/evidence').then((m) => ({ default: m.EvidencePage })),
)
const ClaimsWithoutEvidencePage = lazy(() =>
  import('@/features/evidence').then((m) => ({ default: m.ClaimsWithoutEvidencePage })),
)
const ExportPage = lazy(() =>
  import('@/features/export').then((m) => ({ default: m.ExportPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/pages/settings-page').then((m) => ({ default: m.SettingsPage })),
)
const MigrationWizardPage = lazy(() =>
  import('@/features/migration').then((m) => ({ default: m.MigrationWizardPage })),
)
const MigrationAdminPage = lazy(() =>
  import('@/features/migration').then((m) => ({ default: m.MigrationAdminPage })),
)
const DesignSystemPage = lazy(() =>
  import('@/app/pages/design-system-page').then((m) => ({ default: m.DesignSystemPage })),
)

function RouteFallback() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageSkeleton cards={2} />
    </div>
  )
}

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<AuthPage />} path="/auth" />

            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route element={<DashboardPage />} index />
                <Route element={<OvernightPlannerPage />} path="overnight" />
                <Route element={<DestinationWorkspacePage />} path="overnight/:destinationId" />
                <Route
                  element={<SampleDaysPage />}
                  path="overnight/:destinationId/sample-days"
                />
                <Route
                  element={<SampleDayDetailPage />}
                  path="overnight/:destinationId/sample-days/:sampleDayId"
                />
                <Route element={<TaxPositionPage />} path="position" />
                <Route element={<TaxSummaryPage />} path="position/summary" />
                <Route element={<QuickClaimHubPage />} path="claim" />
                <Route element={<TransportMenuPage />} path="claim/transport" />
                <Route element={<ApartmentMenuPage />} path="claim/apartment" />
                <Route element={<DestinationsMenuPage />} path="claim/destinations" />
                <Route element={<ClaimFormPage formKey="work" />} path="claim/work" />
                <Route element={<ClaimFormPage formKey="laundry" />} path="claim/laundry" />
                <Route element={<ClaimFormPage />} path="claim/:category/:type" />
                <Route element={<EvidencePage />} path="evidence" />
                <Route
                  element={<ClaimsWithoutEvidencePage />}
                  path="evidence/claims-without-evidence"
                />
                <Route element={<ExportPage />} path="export" />
                <Route element={<SettingsPage />} path="settings" />
                <Route element={<MigrationWizardPage />} path="migration" />
                <Route element={<MigrationAdminPage />} path="settings/migration" />
                <Route element={<DesignSystemPage />} path="design-system" />
              </Route>
            </Route>

            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  )
}
