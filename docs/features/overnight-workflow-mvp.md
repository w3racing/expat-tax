# Overnight workflow — MVP

**Status:** Canonical MVP spine  
**Priority:** P0 — foundation of AJX Tax MVP  
**ADR:** [ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md)  
**Philosophy:** Simple. Reliable. Fast. Audit-ready.

## Purpose

Deliver the proven AJX Calculator overnight claim workflow as the primary product path in AJX Tax.

This is **not** a generic expense tracker. It is a fixed sequence: overnight counts → evidence → destination sample days → receipts → average daily spend → claim on Tax Position.

## Source of truth

| Artefact | Authority |
|----------|-----------|
| Overnight counts (destination × month) | **Source of truth** for how many overnights qualify |
| Sample days + receipts | **Source of truth** for average daily spend for that destination |
| Roster / payslip / PDF uploads | **Evidence only** — substantiate; never silently overwrite overnight counts |
| Tax Position claim line | Displays the computed claim with provenance |

## User flow (required)

1. **Create or select a financial year.**
2. **Enter overnight counts manually** by destination and month.
3. **Upload supporting evidence** (rosters, payslips, receipts, PDFs, screenshots).
4. **Click a destination.**
5. **Create sample days** for that destination.
6. **Enter receipts** for each sample day.
7. **Complete the sample day.**
8. **Automatically calculate** the average daily spend.
9. **Apply that average** to every qualifying overnight.
10. **Display the resulting claim** in the Tax Position.

Happy path requires **no AI** and **no roster interpretation**.

## Detailed behaviour

### Financial year

- User creates or selects an Australian FY (1 July – 30 June).
- All overnights, sample days, evidence, and the claim are FY-scoped.

### Overnight table

- Manual grid/entry: destination × month → overnight count.
- Counts are editable explicit inputs with audit trail (actor, time).
- Nothing auto-fills overnight counts from rosters in MVP.
- Empty state guides the user to add a destination and enter counts.

### Evidence

- Upload files into Evidence Vault for the FY.
- Categories include roster, payslip, receipt, and general supporting docs.
- Linking evidence to a destination, sample day, or claim is optional but encouraged.
- Manual uploads are ready immediately (no OCR wait). Retry on failure (U5).

### Destination → sample days

- Selecting a destination opens that destination’s sample-day workspace.
- User creates one or more sample days (representative days for average spend).
- Each sample day holds receipt lines (amount, description, optional currency/FX snapshot, optional evidence link).
- Completing a sample day locks it for average calculation (with confirm + undo where practical).

### Average daily spend

- When one or more sample days are complete, the system calculates average daily spend for that destination.
- Formula and inputs are shown (U11): which days, which receipts, what total, what divisor.
- Incomplete sample days do not silently inflate or deflate the average — rules must be explicit in UI copy.

### Apply to qualifying overnights

- Qualifying overnight count comes from the overnight table for that destination (and FY rules for “qualifying” if any — default: all entered overnights for the destination).
- Claim amount = average daily spend × qualifying overnight count.
- Override (if offered) must not erase the calculated average; both calculated and applied figures remain visible (same pattern as Calculator overseas override discipline).

### Tax Position

- The destination overnight claim appears in Tax Position as a first-class claim figure.
- Provenance expands to: overnight counts, sample days, receipts, average, multiplier, evidence links.
- Gaps are honest: missing sample days, incomplete days, or zero overnights — never invented precision.

## Explicit exclusions

| Excluded | Why |
|----------|-----|
| Generic expense-tracker IA | Dilutes the proven overnight path |
| Roster parsing / trip extraction as a requirement | Roster is evidence only in MVP |
| AI OCR / auto-classification as a requirement | AI is a future adapter |
| Overnight counts derived from calendar/roster | Would replace the overnight table as source of truth |

## Future extension points

| Capability | How it attaches later |
|------------|------------------------|
| Roster OCR | Suggests draft overnight counts or trips; user accepts into overnight table |
| Receipt AI | Suggests draft sample-day lines; user accepts |
| Timeline / trips | Visual bridge for evidence; overnight table remains calculation authority |
| Fixed ATO daily rates | Optional alternate method with explicit method label — must not hide sample-day path |

## Data / API (logical)

Entities (names indicative):

- `destination` (catalogue)
- `overnight_count` — destination × month × count (authoritative)
- `sample_day` — destination × FY × status (draft / complete)
- `sample_day_receipt` — lines on a sample day
- `destination_average_daily` — computed snapshot (inputs + result + engine/version)
- `overnight_claim` — applied claim in Tax Position (average × qualifying nights + provenance)

Evidence links are optional FKs to Evidence Vault versions.

## Acceptance criteria

- [ ] User can complete steps 1–10 without AI or roster parsing.
- [ ] Editing overnight counts updates the claim when an average exists.
- [ ] Completing/reopening sample days recalculates average and claim with visible provenance.
- [ ] Roster upload never changes overnight counts without an explicit user action (none in MVP).
- [ ] Empty FY, empty overnight table, and destination with no sample days each have guided empty states (U2).
- [ ] Destructive actions (delete destination counts, delete completed sample day) confirm (U3).
- [ ] Claim figures show audit trail (U12) and calculation trace (U11).
- [ ] Works on phone and desktop; light and dark (U13–U14).

## Standards compliance

| Gate | Application |
|------|-------------|
| U1 | Skeleton on FY, overnight grid, destination sample-day views |
| U2 | Empty states for no FY, no destinations, no overnights, no sample days |
| U3 | Confirm delete of counts / completed sample days / claim-impacting edits |
| U4 | N/A unless long export/recalc jobs — then JobProgress |
| U5 | Upload status + retry |
| U6 | Human errors for save/upload/calc failures |
| U7 | Draft auto-save on overnight grid and sample-day receipt entry |
| U8 | Undo soft-delete of evidence and sample days where practical |
| U9 | Manual uploads `ready`; status enum retained for future AI |
| U10 | N/A until AI suggestions ship |
| U11–U12 | Average and claim fully traceable |
| U13–U15 | Responsive, themed, scalable lists (keyset if history grows) |

### Standards exceptions

| Gate | Exception | Rationale |
|------|-----------|-----------|
| U10 | N/A | No AI in MVP (ADR-024) |
| U9 | Immediate `ready` | No async AI worker yet |

## Commercial expansion

- Overnight / sample-day / claim entities are tenant-scoped (`user_id` now; `organization_id` later).
- Calculation snapshots versioned for API and native clients.
- AI and roster adapters plug into suggestion tables — never own overnight counts.
- Entitlements may later gate evidence volume or export depth without changing the workflow spine.
