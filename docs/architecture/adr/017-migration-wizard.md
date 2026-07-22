# ADR-017: One-time V1 migration wizard (extensible importers)

## Status

Accepted

## Context

Existing AJX Tax Version 1 users need a safe path into the new platform via JSON export. The importer must be trustworthy (validate, preview, dedupe) and designed so future formats (CSV packs, other products) can plug in without rewriting the wizard.

## Decision

Ship a **one-time migration wizard** with an **importer adapter interface**.

1. Default adapter: `ajx-tax-v1` JSON export
2. Pipeline: validate → preview → detect duplicates → import supported entities
3. Preserve original IDs where possible (`legacy_id` / deterministic UUID mapping)
4. Mark all imported records with provenance: **Imported from AJX Tax Version 1**
5. On success, disable the wizard by default (`migration_completed_at`)
6. Administrators may manually re-enable per user
7. Post-migration backups use the **AJX ATO** encrypted backup system (Evidence Vault), not any V1 backup path

## Consequences

- Feature module `features/migration`
- `ImportAdapter` registry for future formats
- Profile flags for wizard visibility
- Import jobs audited; never silent overwrite of existing vault evidence without duplicate resolution
