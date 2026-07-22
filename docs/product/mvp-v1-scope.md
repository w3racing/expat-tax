# AJX Tax MVP v1 — Scope Specification

**Status:** Canonical product scope for MVP v1  
**Audience:** Product, engineering, design  
**Companion:** [01-mvp-v1.md](./01-mvp-v1.md) · [Product definition](./00-product-definition.md) · [Overnight workflow](../features/overnight-workflow-mvp.md) · [ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md) · [ADR-022](../architecture/adr/022-incremental-mvp.md) · [ADR-023](../architecture/adr/023-mvp-v1-implementation-architecture.md)

This document defines what a real person can do with AJX Tax from day one. Prefer a finished overnight-claim product over unfinished generic tax systems.

---

# Product Goal

AJX Tax v1 is a **personal Australian tax application** built around the proven AJX Calculator **overnight workflow**.

Philosophy:

> Simple. Reliable. Fast. Audit-ready.

It helps a user:

1. Create or select a financial year.  
2. Enter overnight counts manually by destination and month.  
3. Upload supporting evidence (rosters, payslips, receipts, PDFs, screenshots).  
4. Create sample days per destination, enter receipts, and complete those days.  
5. See average daily spend calculated and applied to qualifying overnights.  
6. Review the claim on Tax Position with provenance.  
7. Export a clean package for their accountant.  
8. Optionally import existing Calculator / planner data that maps into this workflow.

**Roster is evidence. The overnight table is the source of truth.**

AJX Tax v1 does **not** lodge with the ATO, give personalised tax advice, replace a tax agent, require AI, or require roster interpretation.

**Success for MVP:** A real user can complete the overnight claim workflow end-to-end on phone or desktop — without AI, without roster parsing, and without being pushed into a generic expense tracker.

---

# Included Features

## Authentication

- Sign in (Google OAuth via Supabase when configured; local mode when not).  
- Session persists; sign out always available.  
- Position, overnights, and evidence are private to the account.

## Financial year

- Create or select an Australian FY (1 July – 30 June).  
- Dashboard and overnight workflow default to the active FY.

## Overnight workflow (spine)

| Step | MVP behaviour |
|------|----------------|
| **Overnight counts** | Manual entry by destination and month — authoritative |
| **Evidence upload** | Rosters, payslips, receipts, PDFs, screenshots; status + retry |
| **Destination workspace** | Open a destination → sample days |
| **Sample days** | Create days; enter receipt lines; complete day |
| **Average daily spend** | Auto-calculated from completed sample days; formula visible |
| **Apply to overnights** | Average × qualifying overnight count |
| **Tax Position claim** | Resulting claim displayed with provenance |

Do **not** redesign this into a generic expense tracker.

## Tax Position

- Displays the overnight-derived claim as a first-class figure.  
- Provenance expands to overnight counts, sample days, receipts, average, and evidence links.  
- May retain additional FY ledgers (income, other claims, FX) for Calculator continuity and indicative tax summary — but **IA and primary path centre the overnight workflow**, not a bookkeeping suite.

## Evidence

| Capability | MVP behaviour |
|------------|----------------|
| **Upload** | Photos and PDFs; status; retry on failure |
| **Organise** | Category / tags; FY filter |
| **Link** | Optional link to destination, sample day, or claim |
| **Roster** | Uploadable evidence only — no interpretation required |

Manual uploads are marked ready immediately (no OCR wait).

## Import

- Import Calculator / planner backups where overnight counts and sample-day / receipt structures can be mapped.  
- Soft warnings for unmapped fields — never invent figures.  
- Receipt folders / sample-day equivalents must not remain permanently “skipped” if they are the spine of MVP.

## Export

- Accountant summary PDF with overnight claim provenance.  
- JSON backup for portability (`ajx-tax-backup` — planner + sample days + evidence).  
- ZIP with evidence index and linked files when present.
- Restore via Settings → Backup & restore (typing gate).

## Dashboard

Calm home for the FY: active year, overnight/sample-day progress, claim stance, evidence gaps, recent activity. Guided empty states — not panic zeros.

---

# Excluded from MVP

| Excluded | Why |
|----------|-----|
| **Generic expense-tracker UX** | Wrong product; abandons proven workflow |
| **Roster interpretation / parsing** | Roster is evidence; overnight table is source of truth |
| **AI OCR / classification** | Not a dependency; stubs/adapters only |
| **Google Drive sync** | Upload-first; Drive later |
| **Accountant portal** | Package export only |
| **Advanced audit workspace** | Provenance on the claim is enough for MVP |
| **Bank feeds** | Out of scope |

Also out: email ingest, billing/orgs, native apps, conversational assistant, trip timeline as calculation authority.

---

# Future Extension Points

| Future capability | Attachment point |
|-------------------|------------------|
| **AI OCR / ingest** | Suggest draft receipt lines or overnight counts; never silent overwrite |
| **Roster interpretation** | Suggest drafts into overnight table; user accepts |
| **Google Drive sync** | Mirror/import into same evidence tables |
| **Accountant portal** | Collaboration on top of Position + Evidence |
| **Advanced audit mode** | Consumes overnight claim + evidence links |
| **Fixed daily-rate method** | Optional alternate path with explicit method label — must not hide sample-day averages |

**Rules:**

- Overnight table remains authoritative for counts (ADR-024).  
- Tax Position remains calculation/display authority for the claim (ADR-021).  
- Evidence Vault remains document authority.  
- New features plug in via adapters — no rewrite of overnight / sample-day core.  
- Do not ship UI that promises AI or roster parsing until those features exist.

---

# Usability bar

MVP is done when a real person can:

1. Sign in.  
2. Create/select a FY.  
3. Enter overnight counts by destination and month.  
4. Upload evidence.  
5. Create and complete sample days with receipts.  
6. See average daily spend applied to qualifying overnights.  
7. See the claim on Tax Position with provenance.  
8. Export an accountant package.  

All of the above on mobile and desktop, light and dark, with clear empty states and non-technical errors — **without AI and without roster parsing**.
