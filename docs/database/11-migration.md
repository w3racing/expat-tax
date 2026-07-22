# Migration schema

## Profile flags

| Column | Type | Notes |
|--------|------|-------|
| `migration_completed_at` | timestamptz | set on successful import |
| `migration_wizard_enabled` | boolean | default false after complete; admin may set true |
| `migration_last_batch_id` | uuid | nullable |

## `import_batches`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `adapter_id` | text | `ajx-tax-v1` |
| `status` | text | `previewed` \| `importing` \| `completed` \| `failed` |
| `source_filename` | text | |
| `source_checksum` | text | |
| `counts` | jsonb | per entity |
| `duplicate_report` | jsonb | |
| `error_message` | text | |
| `created_at` / `completed_at` | timestamptz | |

## `legacy_id_map`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `import_batch_id` | uuid | |
| `entity_type` | text | |
| `legacy_id` | text | |
| `new_id` | uuid | |
| Unique `(user_id, entity_type, legacy_id)` | | |

## Provenance columns (on imported entities)

Add to evidence, employers, payslips, trips, claims as applicable:

| Column | Type | Notes |
|--------|------|-------|
| `legacy_id` | text | |
| `import_batch_id` | uuid | |
| `provenance_source` | text | `ajx_tax_v1` |
| `provenance_label` | text | `Imported from AJX Tax Version 1` |
| `imported_at` | timestamptz | |
| `legacy_payload` | jsonb | unsupported fields |
