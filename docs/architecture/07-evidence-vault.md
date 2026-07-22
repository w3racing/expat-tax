# Evidence Vault

## Purpose

The Evidence Vault guarantees that user evidence is durable, user-owned, restorable, and audit-ready.

Every evidence file must exist in three places:

1. `Supabase` metadata ledger
2. App-controlled cloud storage
3. User-owned Google Drive

This design supports:

- Automatic Google Drive folder provisioning
- Deterministic file placement
- Continuous Drive synchronisation
- Conflict resolution without permanent loss
- Archive and restore flows
- Seven-year evidence retention
- Encrypted monthly backups

## Ownership model

AJX Tax is the organiser, not the owner.

| Layer | Ownership role |
|-------|----------------|
| `Supabase` | Canonical metadata ledger |
| `Vercel Blob` | Canonical application binary copy |
| `Google Drive` | User-owned mirrored copy |

The canonical binary copy remains app-controlled so product features, OCR, previews, and restoration do not depend on Google API availability. The user-owned Drive copy ensures portability and trust.

## Managed Drive structure

When a user connects Google Drive, AJX Tax automatically creates and stores ids for:

```text
AJX ATO/
  <Financial Year>/
    Income/
      Payslips/
      PAYG/
      Employment/
    Travel/
      Rosters/
      Flight Receipts/
      Hotels/
      Boarding Passes/
      Visas/
    Work Expenses/
      Meals/
      Transport/
      Equipment/
      Internet/
      Phone/
      Uniform/
    Investments/
    Rental Property/
    Tax Return/
    Audit Package/
    Backups/
```

Rules:

1. Root folder name is always `AJX ATO`
2. Financial-year folders are created lazily on first evidence for that FY or eagerly during FY rollover
3. Folder ids are stored in the database and reused; lookups do not depend on name matching
4. The user may rename files, but renaming managed folders inside the vault is discouraged and surfaced if detected

## Placement model

Each evidence item maps to exactly one target Drive folder for its current primary classification.

Examples (from AI `document_type`):

| `document_type` | Vault path |
|-----------------|------------|
| `payslip` | `Income/Payslips` |
| `employment_contract` | `Income/Employment` |
| `invoice` (PAYG-related) | `Income/PAYG` |
| `roster` | `Travel/Rosters` |
| `receipt` (flight) | `Travel/Flight Receipts` |
| `travel_itinerary` | `Travel/Flight Receipts` or `Travel/Hotels` by content |
| `receipt` (hotel) | `Travel/Hotels` |
| `receipt` (meal, work context) | `Work Expenses/Meals` |
| `receipt` (transport) | `Work Expenses/Transport` |
| `utility_bill` | `Work Expenses/Internet` or `Phone` by utility type |
| `lease` | `Rental Property` |
| `dividend_statement` | `Investments` |
| `capital_gains_statement` | `Investments` |
| `bank_statement` | `Investments` or FY root by user segment |
| encrypted backup output | `Backups` |

Classification may change after AI processing or user correction. When the resolved target folder changes, AJX Tax moves the Drive file and records the move as a sync event.

## Lifecycle

### 1. Upload

1. User uploads or captures a document
2. File is durably written to cloud storage
3. `evidence_items` and `evidence_files` rows are created
4. If Drive is connected, the file is mirrored into the correct managed folder
5. AI ingest runs asynchronously
6. If classification changes the target folder, Drive placement is corrected

### 2. Sync

AJX Tax maintains a Drive sync cursor per connected account and continuously ingests remote changes:

- rename
- move
- content replace / new revision
- trash / delete
- restore from trash

### 3. Archive

Evidence is never hard-deleted from the logical system. User delete actions archive the evidence:

- product status -> `archived`
- file remains in cloud storage
- Drive file is moved to a managed archive location or marked archived in place, depending on policy
- audit trail is appended

### 4. Restore

Archived evidence can be restored to the live library. Restore reactivates metadata, rehydrates search indexes if needed, and ensures the Drive mirror still exists or is recreated.

## Synchronisation model

### Direction

Sync is **bidirectional for metadata-safe changes** and **app-led for structural policy**.

| Change type | Source of truth | Behaviour |
|-------------|-----------------|-----------|
| Metadata row creation | App | Fan out to Blob + Drive |
| Folder placement | App policy | App moves Drive file |
| File rename in app | App | Rename mirrored Drive file |
| File rename in Drive | Drive event | Update metadata name, preserve ids |
| File content replace in Drive | Drive revision event | Create vault revision, optionally refresh Blob |
| Delete/trash in Drive | Drive event | Mark as archived or missing, never hard-delete |
| Restore from Drive trash | Drive event | Clear archived/missing state |

### Rename detection

The stable key is `drive_file_id`, not file name. Name deltas update metadata and create an `evidence_sync_events` row.

### Replace detection

Drive revision changes or checksum mismatch create a new **`evidence_versions`** row. The prior version remains intact with its Blob path, checksum, Drive revision id, and claim bindings. AJX Tax never overwrites provenance silently. See [09-document-version-history.md](./09-document-version-history.md).

### Delete detection

If a Drive file is trashed or deleted:

1. Mark the mirror state as `trashed` or `missing`
2. Preserve the Blob copy and metadata
3. Surface a restore / recreate action
4. Attempt automated recreation when policy allows and the user has not intentionally disconnected Drive

## Conflict resolution

Conflicts occur when both app and Drive change the same file metadata or content near the same sync window.

Resolution policy:

1. Never discard either side
2. Preserve existing evidence id
3. Write a new revision row when content differs
4. For rename-only conflicts, prefer the most recent timestamp but keep prior names in sync history
5. For folder conflicts, reapply managed-folder policy and log the reason
6. For delete-vs-edit conflicts, prefer preservation: archive instead of delete

User-facing outcomes:

- `Resolved automatically`
- `Needs review`
- `Restored from archive`
- `Mirror recreated`

## Retention and backups

### Seven-year retention

- No permanent evidence deletion before retention expiry
- Archived items remain searchable through privileged restore flows
- Retention timer is based on evidence financial year end, unless stricter legal/event rules apply later

### Encrypted monthly backups

On a monthly schedule, AJX Tax creates encrypted backup packages per user and FY:

- metadata manifest
- file inventory
- checksums
- encrypted archive payload or references

Backups are stored in app-controlled backup storage and optionally mirrored to `Backups/` in the user's Drive vault. Encryption keys remain server-managed; plaintext archives are never written to public storage.

## Operational jobs

Required jobs:

- Drive folder bootstrap
- Post-upload Drive mirror
- Drive changes poll / webhook consumer
- Mirror repair job for missing Drive files
- Monthly encrypted backup job
- Retention audit job
- Archive restore job

## UX implications

The product should show vault health clearly but calmly:

- `Stored in vault`
- `Mirrored to Drive`
- `Needs sync attention`
- `Archived safely`
- `Backup complete`

This is a trust feature, not a technical dashboard. Default UI should emphasise ownership and recoverability, not sync jargon.
