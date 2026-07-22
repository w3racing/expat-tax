# Document versions

## Purpose

Every document supports full version history so users can replace living files — especially rosters, flight receipts, hotel bookings, invoices, and payslips — without losing prior evidence.

## User promise

- Replace freely; nothing is destroyed
- Archive and restore anytime
- Compare any two versions
- Claims stay bound to the version they used
- Audit Mode can include the full history

## Actions

| Action | Result |
|--------|--------|
| **Replace** | New version becomes current; old version kept |
| **Archive** | Hidden from live library; fully recoverable |
| **Restore** | Return archived item, or bring a prior version forward as a new version |
| **Compare Versions** | Side-by-side / stacked review of two versions |

## Version details shown

Each version displays:

- Date
- User (or System / Drive sync)
- Reason
- Linked claims
- Google Drive file id (and revision when available)
- Checksum
- Modification history timeline

## UX

- Evidence detail → **Versions** section
- Replace is primary for high-churn types (roster, payslip, itinerary, invoice, hotel)
- Compare opens calm dual preview with field diffs
- Phone: stacked compare; Desktop: split pane
- Never expose raw revision jargon in primary chrome

## Audit Mode

Optional toggle: **Include historical versions**

- Off: current versions only (default, lighter package)
- On: full chains + modification history + claim bindings + checksums + Drive ids

## Acceptance

- Replacing a document never deletes the prior Blob or version row
- Restoring a prior version appends a new version (history preserved)
- Claims do not silently jump to the latest version
- Compare works for images and PDFs
- Audit export respects the historical-versions flag
- Drive-detected replaces create version rows with reason `drive_replace`
