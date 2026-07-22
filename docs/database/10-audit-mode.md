# Audit Mode schema

## `audit_packages`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | owner |
| `financial_year` | text | |
| `status` | text | `queued` \| `running` \| `ready` \| `failed` |
| `include_historical_versions` | boolean | |
| `include_accountant_notes` | boolean | |
| `include_tax_calculations` | boolean | default true |
| `ruleset_version` | int | |
| `claim_counts` | jsonb | `{ green, yellow, red }` |
| `summary_pdf_pathname` | text | |
| `timeline_pdf_pathname` | text | |
| `evidence_index_csv_pathname` | text | |
| `evidence_index_pdf_pathname` | text | |
| `zip_pathname` | text | |
| `zip_checksum_sha256` | text | |
| `manifest` | jsonb | |
| `drive_file_id` | text | mirrored zip or folder |
| `requested_by` | uuid | owner or accountant |
| `collaboration_id` | uuid | nullable |
| `error_message` | text | |
| `created_at` / `completed_at` | timestamptz | |

## `audit_claim_statuses`

Materialised per FY for Audit Mode UI (recomputed with readiness/dashboard).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | |
| `claim_id` | uuid | deduction_claim or synthetic income claim key |
| `claim_kind` | text | `deduction` \| `income_month` \| `travel` \| `investment` \| `rental` \| `other` |
| `label` | text | |
| `status` | text | `green` \| `yellow` \| `red` |
| `status_label` | text | Evidence Complete / Mostly Complete / Missing Evidence |
| `missing_reasons` | jsonb | string array |
| `linked_evidence_ids` | uuid[] | |
| `linked_version_ids` | uuid[] | |
| `ruleset_version` | int | |
| `computed_at` | timestamptz | |

Unique `(user_id, financial_year, claim_id, claim_kind)`.

## `audit_package_files`

Inventory of files inside a generated package (for re-download integrity).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `audit_package_id` | uuid | |
| `section` | text | e.g. `07-Receipts` |
| `relative_path` | text | |
| `evidence_id` | uuid | nullable |
| `evidence_version_id` | uuid | nullable |
| `checksum_sha256` | text | |
| `byte_size` | bigint | |

## Claim traffic-light derivation

Job `recompute-audit-claim-statuses` runs with readiness recompute. Audit Mode UI reads this table — no heavy live graph on click beyond fetching linked evidence rows by id list.
