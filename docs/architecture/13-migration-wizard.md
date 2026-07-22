# Migration wizard

## Purpose

One-time guided import from **AJX Tax Version 1** JSON exports into the new Evidence Vault platform.

After a successful import:

- The wizard is **disabled by default**
- Backups use the **AJX ATO** backup system only
- Administrators can manually re-enable the wizard for a user

## Extensibility

Importers implement a shared adapter:

```ts
interface ImportAdapter {
  id: string
  label: string
  accept: string[] // MIME / extensions
  parse(input: File | string): Promise<CanonicalImportBundle>
  validate(bundle: CanonicalImportBundle): ValidationResult
  preview(bundle: CanonicalImportBundle): PreviewSummary
  detectDuplicates(bundle, existing): DuplicateReport
  toWritePlan(bundle, decisions): ImportWritePlan
}
```

Registry maps `id` → adapter. Wizard UI is format-agnostic after file selection.

| Adapter id | Status |
|------------|--------|
| `ajx-tax-v1` | Implemented |
| Future CSV / other | Register new adapter |

## Wizard steps

1. **Upload** — select V1 JSON export
2. **Validate** — Zod schema + structural checks; fail closed with clear errors
3. **Preview** — counts and sample rows per entity
4. **Duplicates** — checksum / legacy id / fuzzy matches; user resolve skip vs import
5. **Import** — write entities with provenance; progress
6. **Complete** — success summary; wizard auto-disabled; CTA to Home / connect Drive

## Supported V1 entities

Mapped into canonical model where supported:

- Profile preferences (partial)
- Employers
- Evidence / documents (metadata; binary URLs re-fetched or marked pending if missing)
- Payslips
- Trips / travel days
- Deduction claims + links
- Notes
- Tags

Unsupported V1 fields are preserved in `legacy_payload` jsonb when safe.

## ID preservation

| Strategy | When |
|----------|------|
| Keep UUID if valid and free | Prefer |
| Map `legacy_id` → new UUID in `legacy_id_map` | Collision or non-UUID |
| Always store `legacy_id` on row | Every imported entity |

## Provenance

Every imported row sets:

- `provenance_source = ajx_tax_v1`
- `provenance_label = "Imported from AJX Tax Version 1"`
- `imported_at`
- `import_batch_id`

Evidence items also get an `evidence_events` / version event note with that label.

## Duplicate detection

1. Exact `legacy_id` already imported
2. Exact `checksum_sha256` match
3. Fuzzy: same date + amount + merchant (medium confidence)

UI: Skip / Import anyway per group; bulk “Skip all exact”.

## Disable / re-enable

| Flag | Meaning |
|------|---------|
| `migration_completed_at` | Successful import finished → wizard hidden |
| `migration_wizard_enabled` | Admin override; when true, wizard available even after completion |

Default after success: `migration_wizard_enabled = false`.

Admin Settings (internal) or support tooling sets `migration_wizard_enabled = true`.

## Post-migration backups

V1 backup mechanisms are not used. Ongoing backups are **AJX ATO** encrypted monthly backups + Drive `Backups/` per Evidence Vault.

## Related

- [ADR-017](./adr/017-migration-wizard.md)
- [V1 export contract](../api/11-migration-v1-export.md)
- [Database](../database/11-migration.md)
- [Feature](../features/17-migration-wizard.md)
