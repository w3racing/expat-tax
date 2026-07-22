# Evidence Vault sync API

## Required functions

| Function | Purpose |
|----------|---------|
| `bootstrap-drive-vault` | Create root and managed folder tree, persist folder ids |
| `mirror-evidence-to-drive` | Copy a newly uploaded Blob file into the target Drive folder |
| `reconcile-drive-placement` | Move mirrored file after classification or user correction |
| `sync-drive-changes` | Consume Google Drive changes cursor and apply rename / replace / trash / restore deltas |
| `repair-drive-mirror` | Recreate a missing Drive mirror from Blob |
| `archive-evidence` | Archive evidence without destructive deletion |
| `restore-evidence` | Restore archived evidence and recreate mirror if needed |
| `create-monthly-backup` | Create encrypted backup package and manifest |

## Sync event handling

### Rename

- Match by `drive_file_id`
- Update metadata display name
- Append `evidence_sync_events`

### Replace

- Detect new Drive revision or checksum mismatch
- Create `evidence_file_revisions` row
- Refresh Blob mirror if policy allows
- Preserve prior revision history

### Delete / trash

- Mark `drive_mirror_status = trashed | missing`
- Create archive or repair event
- Never hard-delete metadata or Blob binary

### Restore

- Clear missing/trashed state
- Re-link to the original `drive_file_id` when possible

## Conflict semantics

The API must return machine-readable outcomes:

```json
{
  "result": "applied | needs_review | recreated | archived",
  "conflictType": "none | rename | replace | delete_vs_edit | placement",
  "evidenceFileId": "uuid"
}
```

## Scheduling

- frequent Drive sync job
- daily mirror repair scan
- monthly backup job
- periodic retention audit
