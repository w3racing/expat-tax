# Insights Dashboard

## Purpose

Home is a calm, visual command centre for the selected financial year.

It answers, at a glance:

1. Am I likely getting a **refund** or do I **owe**?
2. How **complete** is my evidence?
3. What is **missing**?
4. What has happened **recently**?
5. What should I do **next**?

It does **not** display tax forms, lodgement worksheets, or spreadsheet layouts.

## Design language

| Prefer | Avoid |
|--------|-------|
| Large numbers with quiet labels | Form fields |
| Cards with one insight each | Multi-column data tables |
| Progress rings / soft bars | Dense KPI strips of 8+ metrics |
| Mini timelines | Audit grids |
| Sparkline / simple bar / donut | Complex multi-series charts on phone |
| Insight chips (“3 payslips missing”) | Red accounting alarms |

References: Apple Summary, Stripe Home, Linear Insights, Flighty — spacious, premium, glanceable.

## Module catalogue

Every module is a self-contained card or card group. Deep-link on tap.

### 1. Estimated outcome (hero pair)

| Module | Visual | Content |
|--------|--------|---------|
| **Estimated Refund** | Large AUD amount + soft green wash when refund | Indicative only |
| **Estimated Tax Payable** | Large AUD amount + soft amber wash when payable | Indicative only |

Rules:

- Show the **dominant** outcome prominently; secondary as smaller companion
- If insufficient data: “Estimate unavailable” + what’s needed (e.g. more payslips)
- One calm disclaimer near the pair: *Indicative only — not tax advice or a lodged figure*
- Never present as ATO-authoritative

### 2. Evidence Completeness

- Large **ReadinessRing** (0–100)
- Short sentence: “Your return is taking shape”
- Breakdown as soft segmented bar or 3–4 chips (Income · Travel · Expenses · Investments) — not a table

### 3. Missing documents (insight cluster)

Single card with visual gap list (icon + label + count), not a spreadsheet:

| Insight | Deep link |
|---------|-----------|
| **Missing Documents** | Generic gaps from readiness |
| **Missing Receipts** | Evidence filter: receipts needed |
| **Missing Payslips** | Income / payslip coverage |
| **Missing Rosters** | Timeline / travel gaps |

Empty gaps → success soft banner: “No critical gaps right now.”

### 4. Travel pulse

| Module | Visual |
|--------|--------|
| **Travel Days** | Big number + sparkline of days by month |
| **Countries Visited** | Horizontal chip row or soft map-dots (no heavy GIS); count + top countries |

Tap → Timeline.

### 5. Activity

| Module | Visual |
|--------|--------|
| **Recent Uploads** | Horizontal media rail or 3–5 compact evidence cards |
| **Recent AI Suggestions** | Insight list with Accept / Review; confidence-aware |

### 6. Money summaries (visual, not ledgers)

| Module | Visual |
|--------|--------|
| **Income Summary** | Total captured + soft bar by employer or month |
| **Work Expense Summary** | Total + category donut / stacked soft bar (meals, transport, uniform…) |
| **Investment Summary** | Document count + amounts captured (dividends / CGT evidence tallies — not portfolio P&L) |

All amounts are **evidence tallies**, not accounting balances.

### 7. ATO Alerts

Quiet callout card (not a news ticker of doom):

- Rate table updates, FY deadlines, known ATO calendar cues relevant to evidence
- Max 2–3 visible; “View all” to Settings / Alerts
- Tone: informative, never panic

### 8. Quick Actions

Visual action row / grid:

- Capture (camera)
- Upload
- Google Drive
- Review suggestions
- Open Timeline
- Audit Mode (desktop emphasis)

Phone: compact chips + FAB; Desktop: richer action strip.

## Composition by shell

### Phone (`< md`)

Vertical scroll, one column:

1. FY chip + greeting
2. Estimated outcome (stacked: primary large, secondary compact)
3. Completeness ring
4. Missing insights (collapsed list)
5. Quick actions (scroll chips)
6. Recent uploads
7. Travel days + countries (compact pair)
8. Income / expenses / investments (stacked summary cards)
9. AI suggestions
10. ATO alerts (bottom, quiet)

FAB remains Capture.

### Tablet (`md`–`lg`)

Two columns:

| Left | Right |
|------|-------|
| Outcome + Completeness | Missing docs cluster |
| Travel pair | Recent uploads |
| Income + Expenses | Investments + AI suggestions |
| Quick actions full width | ATO alerts |

### Desktop (`lg+`)

Three-zone layout (no horizontal scroll):

```text
┌─────────────┬──────────────────┬─────────────┐
│ Outcome     │ Completeness     │ Missing     │
│ Refund/Pay  │ Ring + chips     │ insights    │
├─────────────┴──────────────────┴─────────────┤
│ Quick Actions                                           │
├──────────────────┬───────────────────────────┤
│ Travel Days      │ Countries · Uploads rail  │
├──────────────────┼───────────────────────────┤
│ Income           │ Expenses · Investments    │
├──────────────────┴───────────────────────────┤
│ AI Suggestions · ATO Alerts                  │
└──────────────────────────────────────────────┘
```

Keyboard: `C` capture, `G H` home focus, `⌘K` actions.

## Data sources

| Module | Source |
|--------|--------|
| Completeness / Missing | `readiness_snapshots` |
| Uploads | `evidence_items` recent |
| AI Suggestions | low-confidence / pending confirmations + category suggestions |
| Travel | `trips` / legs / itinerary evidence |
| Income / Expenses / Investments | Aggregates from evidence + payslips + claims |
| Estimates | `dashboard_estimates` snapshot (async job) |
| ATO Alerts | curated content + rate ingest events |

Estimates and aggregates are **precomputed** (like readiness) so Home stays fast.

## Estimate model (indicative)

Lightweight, evidence-informed — **not** a full tax engine:

Inputs (examples): captured gross from payslips, withheld tax, work expense tallies, investment distributions captured as evidence.

Output: `{ estimatedRefundAud | estimatedPayableAud, confidence, missingInputs[] }`

If confidence low → suppress precise number; show “Building estimate…” with missing inputs as chips.

## Motion

- Cards fade-up on first paint (stagger ≤ 3 groups)
- Ring animates to score once
- Upload rail subtle layout transition
- Respect `prefers-reduced-motion`

## Empty FY state

One composed empty: illustration + “Capture your first document” + Quick Actions. Do not render a skeleton of zeroed scary metrics.

## Accessibility

- All charts have text equivalents
- Outcome colours not sole indicator (label Refund vs Payable)
- Touch targets ≥ 44px on insight rows

## Related

- [Feature: Dashboard](../features/03-dashboard.md)
- [ADR-014](./adr/014-insights-dashboard.md)
- [Database: dashboard snapshots](../database/08-dashboard-snapshots.md)
- [Design patterns](../design-system/07-patterns.md)
