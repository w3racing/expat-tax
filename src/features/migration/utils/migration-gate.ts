const GATE_KEY = 'ajx.migration.gate.v1'

export type MigrationGateState = {
  migrationCompletedAt: string | null
  /** Admin override — when true, wizard is available even after completion. */
  migrationWizardEnabled: boolean
  lastBatchId: string | null
}

const defaultState: MigrationGateState = {
  migrationCompletedAt: null,
  migrationWizardEnabled: true,
  lastBatchId: null,
}

export function readMigrationGate(): MigrationGateState {
  try {
    const raw = localStorage.getItem(GATE_KEY)
    if (!raw) return { ...defaultState }
    return { ...defaultState, ...(JSON.parse(raw) as MigrationGateState) }
  } catch {
    return { ...defaultState }
  }
}

export function writeMigrationGate(state: MigrationGateState) {
  localStorage.setItem(GATE_KEY, JSON.stringify(state))
}

export function isMigrationWizardAvailable(state: MigrationGateState = readMigrationGate()): boolean {
  if (state.migrationWizardEnabled) return true
  return state.migrationCompletedAt == null
}

export function markMigrationCompleted(batchId: string) {
  writeMigrationGate({
    migrationCompletedAt: new Date().toISOString(),
    migrationWizardEnabled: false,
    lastBatchId: batchId,
  })
}

/** Administrators may manually re-enable the wizard. */
export function adminReenableMigrationWizard() {
  const current = readMigrationGate()
  writeMigrationGate({
    ...current,
    migrationWizardEnabled: true,
  })
}

export function adminDisableMigrationWizard() {
  const current = readMigrationGate()
  writeMigrationGate({
    ...current,
    migrationWizardEnabled: false,
  })
}
