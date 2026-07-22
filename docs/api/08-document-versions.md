# Document versions API

## Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `replace-evidence` | POST | Upload new binary; create version; supersede prior |
| `archive-evidence` | POST | Archive evidence and/or specific version |
| `restore-evidence` | POST | Restore archived evidence |
| `restore-evidence-version` | POST | Make prior version current via new append-only version |
| `compare-evidence-versions` | GET | Metadata + preview descriptors for two version ids |
| `list-evidence-versions` | GET | Timeline for an evidence item |
| `rebind-claim-version` | POST | Point claim at a different version |
| `export-audit-package` | POST | Build Audit Mode package; optional include history |

## `replace-evidence`

### Request

```json
{
  "evidenceId": "uuid",
  "blobPathname": "string",
  "checksumSha256": "string",
  "mimeType": "string",
  "byteSize": 12345,
  "reason": "Updated March roster from crew app",
  "reasonCode": "user_replace"
}
```

### Behaviour

1. Verify Blob object exists
2. Insert `evidence_versions` with `state=current`, `version_number = max+1`
3. Mark previous current as `superseded`
4. Set `evidence_items.current_version_id`
5. Write `evidence_version_events` (`created`)
6. Queue AI ingest for new version
7. Queue Drive mirror update; store prior `drive_revision_id` on old version

### Response

```json
{
  "evidenceId": "uuid",
  "versionId": "uuid",
  "versionNumber": 3,
  "supersededVersionId": "uuid"
}
```

## `restore-evidence-version`

Creates a **new** version that copies the restored binary (append-only history). Never mutates the historical row.

```json
{
  "evidenceId": "uuid",
  "restoreFromVersionId": "uuid",
  "reason": "Reverted to original hotel confirmation"
}
```

## `compare-evidence-versions`

```json
{
  "evidenceId": "uuid",
  "leftVersionId": "uuid",
  "rightVersionId": "uuid"
}
```

Returns previews, field diffs from extractions, checksums, Drive ids, actors, reasons, and linked claims per side.

## `export-audit-package`

```json
{
  "financialYear": "2025-26",
  "includeHistoricalVersions": true
}
```

When `includeHistoricalVersions` is true, package includes full version chains, modification events, claim binding snapshots, checksums, and Drive ids.

## Guarantees

- No endpoint hard-deletes version rows or Blob objects within retention
- Replace never overwrites an existing `blob_pathname`
- Drive delete/trash never removes version history
