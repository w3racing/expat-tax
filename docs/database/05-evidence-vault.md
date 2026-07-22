# Evidence Vault schema additions

## Goals

Support:

- permanent Drive file identity
- managed-folder placement
- sync cursors and remote change ingestion
- rename / replace / delete detection
- archive and restore
- seven-year retention
- encrypted monthly backups

## Existing table changes

### `integration_accounts`

Add:

| Column | Type | Notes |
|--------|------|-------|
| `drive_root_folder_id` | text | `AJX ATO` folder id |
| `drive_changes_cursor` | text | last consumed Google changes token |
| `drive_sync_status` | text | `healthy` \| `attention` \| `syncing` |
| `last_drive_sync_at` | timestamptz | |
| `last_drive_sync_error` | text | nullable |

### `evidence_files`

Add:

| Column | Type | Notes |
|--------|------|-------|
| `storage_state` | text | `available` \| `archived` \| `restoring` |
| `drive_file_id` | text not null | permanent remote id once mirrored |
| `drive_parent_folder_id` | text | current managed parent |
| `drive_revision_id` | text | latest known revision |
| `drive_mirror_status` | text | `pending` \| `mirrored` \| `missing` \| `trashed` \| `conflict` |
| `drive_last_seen_at` | timestamptz | |
| `drive_deleted_at` | timestamptz | nullable |
| `archived_at` | timestamptz | nullable |
| `retention_until` | date | minimum keep-until date |

`drive_file_id` must be unique per user for active mirrors.

## New tables

### `drive_folders`

Persistent map of managed folder ids.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | nullable for root folders |
| `folder_key` | text | e.g. `travel_hotels`, `work_expenses_phone` |
| `display_name` | text | visible folder name |
| `drive_folder_id` | text | Google id |
| `parent_drive_folder_id` | text | |
| `path_display` | text | cached human path |
| `is_active` | boolean | |
| `created_at` / `updated_at` | timestamptz | |

Unique key: `(user_id, financial_year, folder_key)`.

### `evidence_file_revisions` → superseded by `evidence_versions`

Binary revision history is owned by **`evidence_versions`** (see [07-document-versions.md](./07-document-versions.md)). Do not maintain a parallel revision table. Each version stores Blob path, checksum, Drive file/revision ids, actor, reason, linked claims, and modification events.

### `evidence_sync_events`

Append-only Drive and vault sync log.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `evidence_id` | uuid | nullable |
| `evidence_file_id` | uuid | nullable |
| `integration_account_id` | uuid | |
| `event_type` | text | `mirror_created` \| `renamed` \| `replaced` \| `trashed` \| `restored` \| `conflict` \| `repair` |
| `source` | text | `app` \| `drive` \| `system` |
| `status` | text | `applied` \| `needs_review` \| `failed` |
| `payload` | jsonb | raw change snapshot |
| `occurred_at` | timestamptz | remote or local event time |
| `created_at` | timestamptz | |

### `evidence_archive_records`

Logical archive state, separate from hard deletion.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `evidence_id` | uuid unique | one active archive record |
| `reason` | text | `user_archived` \| `drive_deleted` \| `retention_hold` |
| `drive_state` | text | `present` \| `trashed` \| `missing` \| `recreated` |
| `archived_at` | timestamptz | |
| `restored_at` | timestamptz | nullable |
| `retention_until` | date | |

### `backup_snapshots`

Monthly encrypted backup inventory.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | |
| `snapshot_month` | date | first day of month |
| `status` | text | `queued` \| `running` \| `complete` \| `failed` |
| `manifest_blob_path` | text | metadata manifest |
| `encrypted_archive_blob_path` | text | nullable if sharded |
| `encryption_key_ref` | text | server-side key reference only |
| `file_count` | int | |
| `total_bytes` | bigint | |
| `created_at` / `completed_at` | timestamptz | |

## Folder key taxonomy

Recommended `drive_folders.folder_key` values:

- `root`
- `fy_root`
- `income`
- `income_payslips`
- `income_payg`
- `income_employment`
- `travel`
- `travel_rosters`
- `travel_flight_receipts`
- `travel_hotels`
- `travel_boarding_passes`
- `travel_visas`
- `work_expenses`
- `work_expenses_meals`
- `work_expenses_transport`
- `work_expenses_equipment`
- `work_expenses_internet`
- `work_expenses_phone`
- `work_expenses_uniform`
- `investments`
- `rental_property`
- `tax_return`
- `audit_package`
- `backups`

## Indexes

Required:

```text
evidence_files (user_id, drive_file_id)
evidence_files (user_id, drive_mirror_status)
evidence_file_revisions (evidence_file_id, created_at desc)
evidence_sync_events (integration_account_id, occurred_at desc)
drive_folders (user_id, financial_year, folder_key) unique
backup_snapshots (user_id, financial_year, snapshot_month) unique
```
