# AJX Tax MVP — Product review

**Date:** 21 Jul 2026  
**Scope:** Auth, Dashboard, Tax Position, Evidence Vault, Import wizard, Accountant export, Settings  
**Verdict:** **MVP-ready for local / early cloud use**, with known scale and collaboration gaps deferred by design.

---

## Executive summary

AJX Tax MVP now covers the core year-long loop: sign in → position → evidence → import → accountant PDF. Shared standards primitives (skeletons, empty states, confirm, progress, errors) are in place on the critical paths. A review pass fixed data-integrity, auth, a11y, and mobile issues that would have blocked a credible MVP handoff.

---

## Scores (1–5)

| Area | Score | Notes |
|------|------:|-------|
| User experience | **4** | Clear empty/progress/error states on main flows; draft save feedback; typing-gate import |
| Mobile usability | **4** | Safe-area bottom nav, 44px touch targets, evidence preview sheet on phone |
| Performance | **3.5** | Route + PDF code-splitting cut main bundle; lists not virtualised yet (OK for MVP volumes) |
| Security | **3.5** | Cloud demo bypass removed; storage RLS coherent; local blobs still in browser storage with 4 MB cap |
| Code quality | **4** | Feature folders + shared primitives; dual evidence store unified |
| Architecture | **4** | Parity engine isolated; adapters for import; Drive-ready columns unused |
| Maintainability | **3.5** | Some module-level importer state remains; QueryClient unused |
| Visual polish | **4** | Semantic tokens + dark mode; overlay token; shell uses shared SideNav/BottomNav |

**Overall: 3.9 / 5 — shippable MVP with documented follow-ups.**

---

## Fixed in this review pass

1. **Evidence single store** — imports write to vault `v2` (dashboard/export/evidence consistent)  
2. **Auth lockdown** — no demo sign-in when Supabase configured; clear local session in cloud mode  
3. **ConfirmDialog** — Radix focus trap / Escape / restore  
4. **AppShell** — shared BottomNav with safe-area; FY cycles available years  
5. **Evidence upload** — no `anon` storage path; quota handling; 4 MB local cap; PDF `sandbox`; soft-delete removes storage object  
6. **Evidence mobile** — bottom sheet preview (no endless stacked scroll)  
7. **Tax summary** — empty state instead of infinite skeleton  
8. **A11y** — form labels, `aria-expanded` on traces, touch targets on chips/nav  
9. **Design** — `--overlay` token; design-system behind auth  
10. **Performance** — lazy routes; dynamic `jspdf` import  
11. **Migration UX** — catalogue errors; shell padding (no double chrome)

---

## Remaining (accepted for MVP / next)

| Item | Priority |
|------|----------|
| IndexedDB / OPFS for local binaries (replace data URLs) | P1 |
| Virtualised lists for large claim/evidence sets | P2 (U15) |
| Remove unused react-query / RHF until needed | P2 |
| Tax Position row delete + confirm | P1 |
| Expense panel label wiring (parity with income) | P1 |
| Encrypt localStorage at rest | Post-MVP |
| Accountant portal / audit packages / Drive | Explicitly out of MVP |

---

## Standards compliance (U1–U15)

| Gate | Status |
|------|--------|
| U1 Skeletons | Pass (auth, dashboard, routes); Position is synchronous local — acceptable |
| U2 Empty states | Pass on Evidence, Export, Summary, Dashboard, Migration logs |
| U3 Destructive confirm | Pass (evidence remove, import typing gate) |
| U4 Long-running progress | Pass (export, import) |
| U5 Upload retry | Pass (evidence upload status + error banner) |
| U6 Actionable errors | Pass (catalogue); migration no longer dumps raw stacks |
| U7 Draft save | Pass (Position DraftStatus + error) |
| U8 Undo | Pass (evidence soft-delete) |
| U9 Doc processing status | Pass (ready/failed pills; AI noop) |
| U10 AI confidence | N/A (noop ingest; exception documented) |
| U11 Calculation provenance | Pass (summary traces) |
| U12 Financial audit trail | Partial (engine version + source on summary/export) |
| U13 Responsive + keyboard | Improved (ConfirmDialog, labels, touch targets) |
| U14 Dark/light tokens | Pass |
| U15 Scale | Deferred virtualisation — OK for personal FY volumes |

---

## Recommendation

**Consider MVP complete** for personal local/cloud early users once smoke-tested:

1. Local sign-in → import sample TaxPlannerState → Position → Evidence upload → Export PDF  
2. Soft-delete evidence + undo  
3. Mobile: bottom nav + evidence sheet  
4. With Supabase env: only Google sign-in offered  

Do **not** market accountant portal, Drive sync, or audit packages until those ships.
