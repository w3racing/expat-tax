# Document versions schema

## Core model

```text
evidence_items 1───* evidence_versions 1───* evidence_version_events
       │                    │
       │                    ├── blob pathname + checksum
       │                    ├── drive_file_id + drive_revision_id
       │                    └── linked_claim_ids snapshot
       │
       └──* claim bindings reference evidence_version_id
```

`evidence_file_revisions` (from Evidence Vault) is absorbed into **`evidence_versions`** as the single version ledger. Do not maintain two competing histories.

## `evidence_versions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | RLS |
| `evidence_id` | uuid FK | |
| `version_number` | int | monotonic per evidence (1, 2, 3…) |
| `state` | text | `current` \| `superseded` \| `archived` |
| `source` | text | `initial_upload` \| `user_replace` \| `drive_replace` \| `restore` \| `repair` \| `system` |
| `reason` | text | required on replace/restore; human-readable |
| `reason_code` | text | enum code for analytics |
| `created_by` | uuid | nullable when `system` |
| `actor_type` | text | `user` \| `system` \| `drive_sync` |
| `effective_at` | timestamptz | business-effective time (default = created_at) |
| `created_at` | timestamptz | |
| `blob_pathname` | text | immutable pointer |
| `blob_url` | text | access strategy per env |
| `mime_type` | text | |
| `byte_size` | bigint | |
| `checksum_sha256` | text | required |
| `drive_file_id` | text | nullable until mirrored |
| `drive_revision_id` | text | nullable |
| `drive_file_name` | text | name at this version |
| `extraction_id` | uuid | FK to extraction for this version |
| `linked_claim_ids` | uuid[] | snapshot at write / refresh |
| `supersedes_version_id` | uuid | prior version when replace/restore |
| `archived_at` | timestamptz | nullable |
| `retention_until` | date | |

Constraints:

- Unique `(evidence_id, version_number)`
- At most one row with `state = current` per `evidence_id` (partial unique index)
- `checksum_sha256` not null

## `evidence_version_events` (modification history)

Append-only log scoped to a version.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `evidence_id` | uuid | |
| `evidence_version_id` | uuid FK | |
| `event_type` | text | `created` \| `renamed` \| `claim_linked` \| `claim_unlinked` \| `archived` \| `restored` \| `drive_synced` \| `compared` \| `note` |
| `actor_type` | text | `user` \| `system` \| `drive_sync` |
| `actor_user_id` | uuid | nullable |
| `message` | text | |
| `payload` | jsonb | before/after snippets |
| `created_at` | timestamptz | |

## Claim binding

### `deduction_claim_evidence`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `claim_id` | uuid | |
| `evidence_id` | uuid | |
| `evidence_version_id` | uuid | **required** |
| `bound_at` | timestamptz | |
| `unbound_at` | timestamptz | nullable |

When a new version becomes current, existing bindings stay on the old `evidence_version_id` until the user rebinds.

## Relationship to `evidence_files`

`evidence_files` represents the **current binary handle** for product convenience (preview, download). On replace:

1. Insert new `evidence_versions` as current
2. Update `evidence_files` to point at new blob / drive ids
3. Prior blob path remains only on the superseded version row

Alternatively, treat `evidence_files` as 1:1 with versions and mark current via `evidence_items.current_version_id`. Prefer:

```text
evidence_items.current_version_id → evidence_versions.id
```

and keep `evidence_files` either deprecated or as a thin alias of the current version.

**Decision:** `evidence_items.current_version_id` is canonical. `evidence_files` may remain for multi-page attachments within a single version (pages of one PDF), each page still belonging to one version.

## Indexes

```text
evidence_versions (evidence_id, version_number)
evidence_versions (evidence_id) where state = 'current'
evidence_versions (user_id, checksum_sha256)
evidence_version_events (evidence_version_id, created_at)
deduction_claim_evidence (claim_id, evidence_version_id)
```
