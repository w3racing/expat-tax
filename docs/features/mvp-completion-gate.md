# MVP completion gate

**Status:** Canonical — do not start advanced automation until this checklist is green.  
**Philosophy:** Simple. Reliable. Fast. Audit-ready.  
**Commercial bar:** Proud to show another professional pilot — [05-commercial-product-bar.md](../standards/05-commercial-product-bar.md).  
**Priority:** Polish, stability, and usability over new features.

## Definition of MVP complete

A real user can finish this loop without AI, OCR, Google Drive, or roster interpretation:

| # | Capability | Where |
|---|------------|--------|
| 1 | Create / select a financial year | Settings → Financial year |
| 2 | Enter overnight counts | Overnight Planner |
| 3 | Upload evidence | Evidence Vault |
| 4 | Create destination sample days | Destination workspace |
| 5 | Enter receipts | Sample day detail |
| 6 | Complete sample days | Sample day detail |
| 7 | Calculate destination averages | Destination workspace (traceable) |
| 8 | Produce a complete Tax Position | Tax Position overnight claim + summary |
| 9 | Export an accountant summary | Export (PDF + ZIP with provenance) |
| 10 | Backup and restore data | Settings → Backup & restore |

## Explicitly deferred (do not implement yet)

| Capability | Why deferred |
|------------|--------------|
| AI / OCR classification | Not required for MVP loop |
| Google Drive sync | Upload-first MVP; Settings shows “Coming later” |
| Roster interpretation / parsing | Roster is evidence only; overnight table is source of truth |
| Accountant portal | Package export is enough |
| Bank feeds / email ingest | Out of scope |

Extension adapters may remain as stubs with clear “later” messaging — never as user-facing dependencies.

## Engineering rule

Before any PR that adds AI, OCR, Drive sync, or roster parsing:

1. Confirm the ten capabilities above work end-to-end on phone and desktop.  
2. Prefer fixing polish / stability / empty states / backup edge cases.  
3. Document any standards exception explicitly.

## Related

- [MVP v1 scope](../product/mvp-v1-scope.md)  
- [Overnight workflow](./overnight-workflow-mvp.md)  
- [ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md)
