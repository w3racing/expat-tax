# ADR-014: Visual insights dashboard (not tax forms)

## Status

Accepted

## Context

Home must orient complex travellers and professionals without looking like MYOB, Xero, or ATO portals. Users need confidence about readiness, gaps, travel, income, and indicative tax outcomes — not form fields.

## Decision

The Home dashboard is a **visual insights surface**:

- Cards, rings, sparklines, timelines, and insight chips
- No tax forms, no spreadsheet grids, no dense ledgers
- Includes **indicative** estimated refund / tax payable derived from captured evidence and user-confirmed income summaries — clearly labelled as estimates, not advice
- Completeness and missing-document insights are primary trust signals
- Quick actions are always reachable

## Consequences

- Dashboard modules are composed per device shell
- Estimate engine is a lightweight readiness-adjacent model, not a full tax calculator product
- Copy and disclaimers must appear once, calmly, near estimates
- Charts stay simple (donut, progress, sparkline, bar); no multi-axis finance charts on phone
