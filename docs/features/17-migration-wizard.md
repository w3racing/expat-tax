# Migration wizard

## Purpose

One-time import from AJX Tax Version 1 JSON export with validation, preview, duplicate detection, and provenance marking.

## Flow

1. Upload JSON
2. Validate structure
3. Preview records
4. Resolve duplicates
5. Import supported entities
6. Mark **Imported from AJX Tax Version 1**
7. Disable wizard by default
8. Continue with AJX ATO backups only

## Admin

Administrators can re-enable the wizard per user (`migration_wizard_enabled`).

## Extensibility

Additional import formats register as new adapters without changing wizard chrome.

## Acceptance

- Invalid JSON fails with clear field paths
- Preview shows entity counts before write
- Exact duplicates detectable and skippable
- Original IDs preserved via `legacy_id` / map
- Successful import hides wizard until admin re-enables
- Post-migration backup path is AJX ATO vault backups only
