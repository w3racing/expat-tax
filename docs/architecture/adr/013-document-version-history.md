# ADR-013: Immutable document version history

## Status

Accepted

## Context

Users frequently replace living documents — roster screenshots, flight receipts, hotel bookings, invoices, and payslips. Overwriting binaries would destroy auditability and break linked claims.

## Decision

Every evidence document supports **immutable version history**.

- **Replace** creates a new version; prior versions remain intact
- **Archive** and **Restore** operate on versions and evidence without permanent deletion
- **Compare Versions** is a first-class product action
- Each version permanently records: date, actor (user/system), reason, linked claims snapshot, Drive file/revision ids, checksum, and modification history
- **Nothing is permanently lost** within the seven-year retention window
- **Audit Mode** optionally includes historical versions in export packages

## Consequences

- `evidence_versions` becomes the canonical history ledger (superseding thin binary-only revision rows)
- Blob objects for superseded versions are retained, never overwritten in place
- Drive mirrors may use revision APIs or versioned filenames under policy, but prior Drive revision ids remain recorded
- Linked claims store which version(s) they referenced at claim time
- Compare UI and Audit Mode must be designed for mobile and desktop
