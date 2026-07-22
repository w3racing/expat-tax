# Destination Workspace

**Status:** Canonical MVP  
**Related:** [Overnight workflow](./overnight-workflow-mvp.md) · [ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md)

## Purpose

Clicking a destination in the Overnight Planner opens a dedicated workspace — the home for all activity relating to that destination.

Example: **Australia**

## Display

| Metric | Source |
|--------|--------|
| Total qualifying overnights | Overnight table (source of truth) |
| Average daily spend / average AUD value | Completed sample days only |
| Destination claim | Qualifying overnights × average (Calculator parity) |
| Financial year overnight claim | Σ (nights × rate) all destinations |
| Sample days completed / in progress | Sample day store |
| Evidence linked | Evidence Vault `destinationId` |
| Claim breakdown | Sample Days → Average → Calculation → Final Claim |

## Actions

- New Sample Day  
- View Sample Days  
- Upload Evidence (pre-fills destination)  
- View Claim Calculation (Sample Days → Average → Calculation → Final Claim)  
- Return to Overnight Planner  

## Routes

| Path | Page |
|------|------|
| `/overnight/:destinationId` | Destination workspace |
| `/overnight/:destinationId/sample-days` | Sample day list |
| `/overnight/:destinationId/sample-days/:sampleDayId` | Sample day detail |

## Calculation parity (AJX Calculator)

Identical overnight maths to the AJX Calculator. When a sample day is **completed** (or reopened / deleted), recalculate:

| Step | What | Formula |
|------|------|---------|
| 1. Sample Days | Completed day AUD totals only | Σ day totals (in-progress ignored) |
| 2. Average | Average daily spend / average AUD value | Σ ÷ count(completed) |
| 3. Calculation | Destination claim | qualifying overnights × average (or planner daily rate if no completed days) |
| 4. Final Claim | Destination + FY overnight claim | destination claim; FY = Σ (nights × rate) all destinations |

Displayed on the destination workspace and in **View Claim Calculation**, with source + formula for every figure (U11–U12). Completing a sample day writes the average into the destination daily rate so Tax Position stays in step. Sample days never overwrite overnight counts.
