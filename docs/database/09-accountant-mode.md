# Accountant Mode schema

## `accountant_collaborations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `owner_user_id` | uuid | evidence owner |
| `accountant_user_id` | uuid | nullable until accept |
| `accountant_email` | text | invite target |
| `status` | text | `pending` \| `active` \| `revoked` \| `expired` |
| `financial_year_scope` | text | `all` or specific FY list in jsonb |
| `financial_years` | text[] | when not all |
| `message` | text | optional invite note |
| `invited_at` | timestamptz | |
| `accepted_at` | timestamptz | |
| `revoked_at` | timestamptz | |
| `expires_at` | timestamptz | pending expiry |
| `created_at` / `updated_at` | timestamptz | |

Unique active/pending: one open invite per `(owner_user_id, accountant_email)`.

## `accountant_permission_grants`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `collaboration_id` | uuid FK | |
| `permission` | text | see enum below |
| `granted` | boolean | |
| `granted_at` | timestamptz | |
| `granted_by` | uuid | owner |

### Permission enum

```text
read_only
comment
request_documents
export_reports
generate_tax_package
generate_working_papers
generate_income_summary
generate_deduction_summary
generate_fx_report
generate_evidence_index
generate_audit_package
```

## `accountant_comments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `collaboration_id` | uuid | |
| `owner_user_id` | uuid | denormalised |
| `author_user_id` | uuid | |
| `evidence_id` | uuid | nullable for FY board |
| `financial_year` | text | |
| `body` | text | |
| `deleted_at` | timestamptz | soft |
| `created_at` / `updated_at` | timestamptz | |

## `accountant_document_requests`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `collaboration_id` | uuid | |
| `owner_user_id` | uuid | |
| `requested_by` | uuid | accountant |
| `title` | text | |
| `description` | text | |
| `suggested_document_type` | text | nullable |
| `financial_year` | text | |
| `status` | text | `open` \| `fulfilled` \| `dismissed` \| `cancelled` |
| `due_on` | date | nullable |
| `fulfilled_evidence_id` | uuid | nullable |
| `created_at` / `updated_at` | timestamptz | |

## `accountant_package_artefacts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `collaboration_id` | uuid | |
| `owner_user_id` | uuid | |
| `requested_by` | uuid | |
| `package_type` | text | tax_package \| working_papers \| income_summary \| deduction_summary \| fx_report \| evidence_index \| audit_package \| generic_report |
| `financial_year` | text | |
| `status` | text | `queued` \| `running` \| `ready` \| `failed` |
| `blob_pathname` | text | |
| `checksum_sha256` | text | |
| `include_historical_versions` | boolean | audit package option |
| `created_at` / `completed_at` | timestamptz | |

## `accountant_audit_events`

Append-only. **No updates. No deletes** (except legal erasure of entire account under privacy process).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `collaboration_id` | uuid | nullable if invite-level |
| `owner_user_id` | uuid | |
| `actor_user_id` | uuid | |
| `actor_role` | text | `owner` \| `accountant` \| `system` |
| `action` | text | e.g. `invite_sent`, `invite_accepted`, `view_evidence`, `comment_created`, `request_created`, `package_requested`, `package_downloaded`, `export_reports`, `permission_denied`, `collaboration_revoked` |
| `resource_type` | text | |
| `resource_id` | uuid | nullable |
| `financial_year` | text | nullable |
| `outcome` | text | `success` \| `denied` \| `failed` |
| `payload` | jsonb | non-sensitive context |
| `created_at` | timestamptz | |

## RLS patterns

- Owner: full manage on collaborations and grants
- Accountant: SELECT evidence when `active` + `read_only` (or any generate grant)
- Accountant: INSERT comments/requests only with matching grants
- Accountant: **no** INSERT/UPDATE/DELETE on `evidence_items`, `evidence_versions`, extractions, claims
- Both: INSERT audit events for own actions (or prefer security definer that always writes audit)

## Indexes

```text
accountant_collaborations (owner_user_id, status)
accountant_collaborations (accountant_user_id, status)
accountant_permission_grants (collaboration_id, permission)
accountant_audit_events (owner_user_id, created_at desc)
accountant_audit_events (collaboration_id, created_at desc)
accountant_document_requests (owner_user_id, status)
accountant_package_artefacts (collaboration_id, created_at desc)
```
