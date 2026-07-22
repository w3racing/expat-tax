import { AppCard, Button, FilterChip, SoftBanner } from '@/shared/components'
import type {
  DuplicateDecision,
  DuplicateReport,
} from '@/features/migration/types/import'

type MigrationDuplicatesStepProps = {
  duplicates: DuplicateReport
  decisions: Record<string, DuplicateDecision>
  onDecision: (legacyId: string, decision: DuplicateDecision) => void
  onSkipAllExact: () => void
  onContinue: () => void
  onBack: () => void
}

export function MigrationDuplicatesStep({
  duplicates,
  decisions,
  onDecision,
  onSkipAllExact,
  onContinue,
  onBack,
}: MigrationDuplicatesStepProps) {
  return (
    <div className="space-y-4">
      <AppCard
        header={
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Duplicates found</h2>
            <p className="text-sm text-muted-foreground">
              Choose whether to skip or import each match. Exact matches default to skip.
            </p>
          </div>
        }
      >
        <SoftBanner tone="warning">
          {duplicates.matches.length} potential duplicate
          {duplicates.matches.length === 1 ? '' : 's'} detected.
        </SoftBanner>

        <div className="mt-4">
          <Button onClick={onSkipAllExact} size="sm" variant="soft">
            Skip all exact matches
          </Button>
        </div>

        <ul className="mt-5 space-y-3">
          {duplicates.matches.map((match) => {
            const decision = decisions[match.legacyId] ?? 'skip'
            return (
              <li
                className="rounded-lg border border-border bg-card p-3"
                key={`${match.entityType}-${match.legacyId}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{match.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {match.entityType} · {match.method} ·{' '}
                      {Math.round(match.confidence * 100)}% confidence
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <FilterChip
                      label="Skip"
                      onToggle={() => onDecision(match.legacyId, 'skip')}
                      selected={decision === 'skip'}
                    />
                    <FilterChip
                      label="Import"
                      onToggle={() => onDecision(match.legacyId, 'import')}
                      selected={decision === 'import'}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </AppCard>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button onClick={onContinue}>Continue to preview</Button>
      </div>
    </div>
  )
}
