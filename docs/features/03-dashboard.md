# Dashboard (Home)

**Status:** Canonical MVP home screen  
**Related:** [Overnight workflow](./overnight-workflow-mvp.md) · [Insights architecture](../architecture/10-insights-dashboard.md)

## Purpose

Calm command centre for the selected financial year — clarity and confidence, not spreadsheets or tax forms.

Answers at a glance:

1. What is my **estimated tax position**?
2. What is my **total overseas claim**?
3. How complete is my **evidence**?
4. What happened **recently** (uploads · sample days)?
5. What should I do **next**?

## Display

| Module | Presentation |
|--------|----------------|
| Current financial year | Label + FY chip (cycle years) |
| Estimated tax position | Hero amount card (refund / payable) · indicative |
| Total overseas claim | Large AUD · nights × daily amount (Calculator parity) |
| Income | Employment + investments |
| Deductions | All claims including overseas |
| Evidence completeness | Readiness ring + short breakdown |
| Recent uploads | Compact evidence list |
| Recent sample days | Compact sample-day list with destination |
| Quick actions | Overnight · Sample days · Upload · Position · Import |
| Gaps | Soft insight list (not alarms) |

## Rules

- **No tax forms** on Home
- **No large tables** — cards and insight lists only
- Estimates are **indicative**, labelled clearly
- Feel: Apple Summary · Stripe Home · Linear — spacious, premium, glanceable
- Empty FY: elegant empty state, not zeroed panic metrics
- Skeleton loading (U1)

## Standards compliance

| Gate | How |
|------|-----|
| U1 Skeleton | `PageSkeleton` while snapshot loads |
| U2 Empty | `DashboardEmpty` with overnight / import CTAs |
| U11–U12 | Overseas claim and estimate deep-link to Tax Summary / Overnight |
| U13–U14 | Responsive grid · semantic tokens · dark/light |

## Acceptance

- All listed modules render without spreadsheet styling
- Tap any insight → correct deep link
- Completing sample days / uploading evidence refreshes on focus
- Loads from local planner + evidence + sample-day stores (no N+1)
