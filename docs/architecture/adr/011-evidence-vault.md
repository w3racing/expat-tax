# ADR-011: Evidence Vault with tri-location durability

## Status

Accepted

## Context

AJX Tax users must own their tax evidence and be able to leave the product without losing access to their files. The platform must also support audit retention, sync recovery, and restoration without permanently deleting evidence.

## Decision

Each uploaded or imported evidence file must exist in **three places**:

1. **Supabase metadata** as the durable ledger of identity, provenance, sync state, and lifecycle
2. **Cloud object storage** as the app-controlled binary source for product operations
3. **User Google Drive** inside a managed AJX folder tree as the user-owned mirror

Google Drive is not the sole system of record, but it is a first-class user-owned copy. The system must persist the Drive file id permanently, sync metadata changes both ways where safe, detect rename / replace / delete operations, and resolve conflicts without destructive loss.

## Consequences

- Upload completion now includes a Drive mirror step after durable cloud storage succeeds
- Drive sync becomes an ongoing subsystem, not a one-time import feature
- Evidence deletion becomes archival-only; binaries are retained for at least seven years
- Monthly encrypted backups are required in addition to the live tri-location model
