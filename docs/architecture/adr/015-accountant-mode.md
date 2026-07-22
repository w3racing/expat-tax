# ADR-015: Accountant Mode (delegated read collaboration)

## Status

Accepted

## Context

Users need to share organised evidence with their accountant without giving up ownership or allowing mutation of original files. ADR-010 established owner-only RLS; firm multi-user portals remain out of scope, but **delegated accountant access** is required.

## Decision

Introduce **Accountant Mode**: the evidence owner invites an accountant by email. Access is granted via `accountant_collaborations` with explicit permission grants.

Hard rules:

1. The accountant **never** creates, replaces, archives, or deletes original evidence or versions
2. Allowed capabilities are limited to: read, comment, request documents, and generate/export packages
3. **Every** accountant action is append-only audited
4. The owner remains the sole vault and Drive authority
5. Collaborations are revocable instantly by the owner

This is **delegation**, not shared ownership. No firm org chart in this ADR.

## Consequences

- RLS expands to “owner OR active collaborator with grant”
- Write paths for evidence remain owner-only
- Comments and document requests are separate tables (accountant-writable)
- Package generation runs as audited jobs producing owner-owned Blob outputs
- Supersedes the “tax agents out of scope” note in ADR-010 for this narrow collaboration model
