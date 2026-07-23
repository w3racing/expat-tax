# Accountant Export MVP

**Status:** Implemented  
**Route:** `/export`  
**Export version:** `mvp-1.2.0`

## Deliverable

A professional **A4 PDF** suitable to send to a registered tax agent, plus a ZIP of supporting files.

### PDF sections

1. Taxpayer details  
2. Financial year  
3. Income summary  
4. Expense summary  
5. Overseas overnight claim (provenance)  
6. Other claims  
7. Tax calculation summary (incl. brackets)  
8. Supporting documents  
9. Notes  

Clear disclaimer: indicative working papers — **not for lodgement**.

### Package ZIP

- Accountant summary PDF  
- `tax-summary.json`  
- `evidence-index.csv`  
- `position-backup.json`  
- `evidence/` binaries when available locally  

## Out of scope (future)

| Capability | Notes |
|------------|--------|
| **Audit packages** | Structured ATO-ready bundles |
| **Accountant portal** | Invites, grants, comments |
| **Evidence bundles** | Curated multi-doc packages with retention |

## Standards

- U2 empty state when no summary  
- U4 `JobProgress` during generation  
- U6 `EXPORT_FAILED` with retry  
- Figures traceable to Tax Position engine version on the PDF footer / metadata  
