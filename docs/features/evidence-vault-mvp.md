# Evidence Vault MVP

**Status:** Canonical for MVP evidence  
**Related:** [mvp-v1-scope](../product/mvp-v1-scope.md) · [ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md) · migration `supabase/migrations/20260721220000_evidence_vault_mvp.sql`

## Purpose

**Document storage only.** Supporting evidence for the overnight claim and Tax Position.

- Do **not** analyse documents  
- Do **not** OCR documents  
- Do **not** interpret rosters  
- Do **not** use Evidence Vault for calculations in MVP  

The overnight table remains the source of truth for overnight counts.

## Upload types

PDF · Images · Screenshots · Payslips · Rosters · Travel documents · Receipts

(Document type / category selects the label; the binary is stored as-is.)

## Organisation

| Dimension | Behaviour |
|-----------|-----------|
| **Financial year** | Scoped via app FY (active year) |
| **Month** | `monthKey` (YYYY-MM) — from document date or explicit |
| **Document type** | Category: receipt, payslip, roster, flight, travel, screenshot, investment, other |
| **Destination** | Optional link to overnight planner destination |

## Stored fields

| Field | Notes |
|-------|--------|
| Filename | Editable (rename); used for download |
| Upload date | `createdAt` |
| Description | Free text |
| Tags | Comma-separated list |
| Document type | Category |
| Storage location | Local browser or private Supabase path |
| Linked claim | Optional Tax Position claim |

Also: title, mime type, size, FY, month, destination, soft-delete timestamps.

## User actions

Upload · Preview · Rename (title + filename) · Replace file · Delete (soft + undo) · Download · Search · Filter (type, month, destination, tag)

## Storage

| Mode | Binary | Metadata |
|------|--------|----------|
| Supabase configured | Private `evidence` bucket path `{user_id}/{fy}/{id}/{filename}` | Local vault mirror + `evidence_items` / `evidence_files` when authed |
| Local / no Supabase | Browser (`dataUrl` in local vault store) | Same client store |

## Drive-ready (not implemented)

`evidence_files` includes nullable Drive columns. Drive sync remains a stub. Do not enable UI that promises Drive until the adapter is real.

## Standards

U1 skeleton · U2 empty · U3 delete confirm · U5 upload status + retry · U8 undo · U9 status enum (`ready` immediately — no AI worker) · U10 N/A
