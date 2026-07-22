# Document version history

## Principle

> Nothing should ever be permanently lost.

Every document in AJX Tax has an immutable version chain. Replacing a roster screenshot, flight receipt, hotel booking, invoice, or payslip **never destroys** the previous file. Prior versions remain viewable, restorable, comparable, and optionally includable in Audit Mode.

## High-frequency replace cases

These document types are expected to change often during the year:

| Document | Typical replace reason |
|----------|------------------------|
| Roster screenshots | Updated roster / revised pairings |
| Flight receipts | Corrected itinerary / reissued ticket |
| Hotel bookings | Amended stay / new confirmation |
| Invoices | Revised amount / reissued invoice |
| Payslips | Corrected payslip / reissued PDF |

Any document type supports versioning; these are the primary UX emphasis.

## Operations

### Replace

1. User selects Replace on an evidence item (or Drive detect replace)
2. New bytes upload to Blob under a new pathname (never overwrite prior path)
3. New `evidence_versions` row created as current
4. Prior version marked `superseded` (not deleted)
5. AI reprocess runs on the new version
6. Drive mirror updated; previous Drive revision id retained on the old version row
7. Linked claims keep their original `evidence_version_id` unless user explicitly rebinds

### Archive

- Soft lifecycle action on evidence and/or a specific version
- Binaries and metadata remain
- Library hides archived items by default
- Drive mirror may move to archive location or retain with archived status

### Restore

| Restore type | Behaviour |
|--------------|-----------|
| Restore archived evidence | Returns item to live library; current version unchanged |
| Restore prior version as current | Creates a **new** version that copies the restored binary (append-only); never mutates history |
| Restore from Drive trash | Relinks or recreates mirror; vault copy remains source of truth |

### Compare Versions

Side-by-side (desktop) or stacked (phone) comparison of two versions:

- Preview (image/PDF pages)
- Metadata diff: dates, merchant/employer, amounts, currency, GST, tax category
- Checksums and Drive ids
- Linked claims that pointed at each version
- Actor, reason, and timestamps

## Version record (required fields)

Every version permanently stores:

| Field | Description |
|-------|-------------|
| **Date** | `created_at` / `effective_at` of the version |
| **User** | `created_by` (`auth.uid()` or `system`) |
| **Reason** | Free-text or enum (`user_replace`, `drive_replace`, `restore`, `repair`, `ai_reprocess_artifact`, custom) |
| **Linked claims** | Snapshot of claim ids bound at version creation / last known bindings |
| **Google Drive File ID** | `drive_file_id` (+ `drive_revision_id` when available) |
| **Checksum** | `checksum_sha256` of the binary |
| **Modification history** | Append-only events for that version (rename, claim link, archive, restore attempt, sync notes) |

## Lifecycle states

```text
version: current | superseded | archived
evidence: ready | needs_review | archived | …
```

- Exactly one **current** version per evidence item (when not fully archived)
- Superseded versions remain fully readable
- Archived versions remain fully restorable

## Claims binding

Deduction claims, income links, and trip links reference **`evidence_version_id`**, not only `evidence_id`.

Rules:

1. Creating a claim binds to the **current** version at bind time
2. Replacing a document does **not** silently move claims to the new version
3. UI offers “Use latest version for claim” when a claim is bound to a superseded version
4. Version record stores a `linked_claim_ids` snapshot for audit clarity

## Drive interaction

| Event | Version impact |
|-------|----------------|
| App Replace | New version + new Blob + Drive content update; old Drive revision id kept |
| Drive content replace | New version sourced as `drive_replace` |
| Drive rename | Modification event on current version; no new binary version unless content changes |
| Drive trash | Archive / missing mirror; versions intact |

## Audit Mode

Audit Mode is a **flagship** product surface. Full specification: [12-audit-mode.md](./12-audit-mode.md).

It prepares a complete ATO-ready package (PDF summary, ZIP, evidence index, chronological timeline) with claim traffic lights (green / yellow / red). Optional **Include historical versions** expands the ZIP with prior document versions.

Audit Package artefacts land in Evidence Vault folder `Audit Package/` when Drive is connected.

## Retention

- All versions retained for the same seven-year window as evidence
- Soft archive only; no hard delete of version rows or Blob paths within retention
- Encrypted monthly backups include version inventory in the manifest

## UX

- Evidence detail: Version history timeline (calm, Flighty-like)
- Primary action: Replace
- Secondary: Archive, Restore, Compare
- Phone: version list → compare sheet
- Desktop: split compare pane
- Voice: “Replaced · 12 Mar · Updated roster” — not “REVISION_ID_7”

## Related

- [ADR-013](./adr/013-document-version-history.md)
- [Database: versions](../database/07-document-versions.md)
- [API: versions](../api/08-document-versions.md)
- [Feature: versions](../features/14-document-versions.md)
- [Evidence Vault](./07-evidence-vault.md)
