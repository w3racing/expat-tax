# Schema (v1)

## Entity relationship (logical)

```text
profiles 1───* evidence_items 1───* evidence_files
    │                │
    │                ├──* evidence_tags (m2m tags)
    │                ├──* evidence_events
    │                └──* evidence_extractions
    │
    ├──* trips 1───* trip_legs
    ├──* employers 1───* payslips
    ├──* deduction_claims
    ├──* readiness_snapshots
    └──* integration_accounts
```

## Enums

```sql
document_type: receipt | payslip | roster | invoice | bank_statement
             | dividend_statement | capital_gains_statement | lease
             | utility_bill | travel_itinerary | employment_contract | other

evidence_kind: (legacy alias — prefer document_type; see 06-ai-extractions.md)

evidence_status: uploaded | processing | needs_review | ready | failed | archived

capture_source: camera | upload | google_drive | email_forward | api

deduction_category: work_uniform | work_travel | self_education
                   | tools_equipment | home_office | donations
                   | investment | other_work | other

trip_purpose: work | mixed | personal
```

## Tables

### `profiles`

Extends auth user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `= auth.users.id` |
| `display_name` | text | |
| `avatar_url` | text | nullable |
| `occupation_segment` | text | pilot, cabin_crew, fifo, consultant, traveller, other |
| `home_timezone` | text | default `Australia/Sydney` |
| `preferred_fy` | text | nullable override |
| `onboarding_completed_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

### `evidence_items`

Core evidence record (one logical document/event).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | RLS |
| `financial_year` | text | `2025-26` |
| `kind` | evidence_kind | |
| `status` | evidence_status | |
| `title` | text | user or AI |
| `description` | text | nullable |
| `occurred_on` | date | transaction/service date when known |
| `amount_aud` | numeric(12,2) | nullable |
| `currency_original` | text | nullable |
| `amount_original` | numeric(12,2) | nullable |
| `merchant_or_payer` | text | nullable |
| `capture_source` | capture_source | |
| `confidence` | numeric(3,2) | 0–1 AI confidence |
| `needs_review_reason` | text | nullable |
| `trip_id` | uuid FK | nullable |
| `employer_id` | uuid FK | nullable |
| `deduction_category` | deduction_category | nullable |
| `metadata` | jsonb | sparse structured extras |
| `deleted_at` | timestamptz | soft delete |
| `created_at` / `updated_at` | timestamptz | |

### `evidence_files`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `evidence_id` | uuid FK | |
| `user_id` | uuid | denormalised for RLS |
| `storage_provider` | text | `vercel_blob` |
| `blob_pathname` | text | |
| `blob_url` | text | access strategy TBD per env |
| `mime_type` | text | |
| `byte_size` | bigint | |
| `checksum_sha256` | text | nullable |
| `drive_file_id` | text | provenance |
| `drive_file_name` | text | |
| `sort_order` | int | multi-page |
| `created_at` | timestamptz | |

### `evidence_events`

Append-only status/audit log.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `evidence_id` | uuid FK | |
| `user_id` | uuid | |
| `from_status` | evidence_status | nullable |
| `to_status` | evidence_status | |
| `actor` | text | `user` \| `system` \| `ai` |
| `message` | text | |
| `payload` | jsonb | |
| `created_at` | timestamptz | |

### `evidence_extractions`

AI extraction payload (versioned).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `evidence_id` | uuid FK | |
| `user_id` | uuid | |
| `model` | text | |
| `schema_version` | int | |
| `raw_response` | jsonb | |
| `normalised` | jsonb | |
| `created_at` | timestamptz | |

### `tags` / `evidence_item_tags`

User or system tags; m2m join with `user_id` on both for RLS simplicity.

### `employers`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `name` | text | |
| `abn` | text | nullable |
| `is_active` | boolean | |

### `payslips`

Links to `evidence_items` optionally; structured pay fields for income context (not a full payroll engine).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `employer_id` | uuid | |
| `evidence_id` | uuid | nullable |
| `financial_year` | text | |
| `period_start` / `period_end` | date | |
| `gross` / `tax_withheld` / `net` | numeric | nullable |
| `metadata` | jsonb | |

### `trips` / `trip_legs`

Travel context for pilots/crew/FIFO/consultants.

| `trips` | Notes |
|---------|-------|
| `purpose` | work / mixed / personal |
| `title` | e.g. "SYD–LAX pairing" |
| `starts_on` / `ends_on` | date |
| `financial_year` | text |

`trip_legs`: origin, destination, departure_at, flight_number, evidence_id nullable.

### `deduction_claims`

User-facing deduction grouping for the FY (evidence rolls up).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | |
| `category` | deduction_category | |
| `label` | text | |
| `notes` | text | |
| `is_archived` | boolean | |

### `readiness_snapshots`

Materialised score for dashboard.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | |
| `score` | numeric(5,2) | 0–100 |
| `breakdown` | jsonb | categories & missing hints |
| `computed_at` | timestamptz | |

### `integration_accounts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `provider` | text | `google` |
| `status` | text | `connected` \| `revoked` \| `error` |
| `scopes` | text[] | |
| `account_email` | text | |
| `drive_root_folder_id` | text | nullable until vault bootstrap |
| `drive_changes_cursor` | text | nullable |
| `drive_sync_status` | text | `healthy` \| `attention` \| `syncing` |
| `encrypted_tokens` | bytea / vault | server-only access pattern |
| `created_at` / `updated_at` | timestamptz | |

### `processing_jobs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `evidence_id` | uuid | |
| `job_type` | text | `ingest` \| `reclassify` \| `readiness` |
| `status` | text | `queued` \| `running` \| `succeeded` \| `failed` |
| `attempts` | int | |
| `last_error` | text | |
| `run_after` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

### `drive_folders`

Managed Google Drive folder ids per user and FY.

### `evidence_versions`

Immutable document version chain (replace, archive, restore, compare). Canonical history ledger including checksum, Drive ids, actor, reason, linked claims.

### `evidence_version_events`

Append-only modification history per version.

### `evidence_sync_events`

Append-only Drive / vault sync log for rename, replace, delete, restore, and conflict outcomes.

### `evidence_archive_records`

Archive ledger for evidence that should never be permanently deleted.

### `backup_snapshots`

Encrypted monthly backup inventory and status.

### `ato_exchange_rates`

ATO monthly average FX rates for AUD normalisation.

### `evidence_duplicate_links`

Suggested and confirmed duplicate relationships.

See [06-ai-extractions.md](./06-ai-extractions.md) for full AI schema.

## Out of schema (v1)

- General ledger / chart of accounts
- Tax calculation engine
- Multi-user organisations
- Full email ingestion tables (stub only when feature ships)
