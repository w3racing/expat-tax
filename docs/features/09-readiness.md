# Return readiness

## Purpose

Answer: “How complete is my evidence for this FY?” with a calm score and actionable gaps.

## Score inputs (examples)

- Payslip coverage across months employed
- Unclassified / needs_review count
- Missing amounts on receipts
- Travel evidence without trip linkage (for travel segments)
- Investment documents present if user flagged investments in settings (optional)

## UI

- Large score
- Breakdown list with deep links
- No scary red accounting alarms — use restrained urgency

## Computation

- Async job writes `readiness_snapshots`
- Cron nightly + on-demand after significant evidence changes

## Acceptance

- Score updates after corrections without full page reload
- Empty FY explains how to improve
