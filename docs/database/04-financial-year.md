# Financial year model

## Definition

Australian FY: **1 July → 30 June**.

Label format: `YYYY-YY` where the second year is the ending calendar year’s short form.

Examples:

- 1 July 2025 – 30 June 2026 → `2025-26`
- 1 July 2024 – 30 June 2025 → `2024-25`

## Assignment rules

1. Prefer `occurred_on` to assign `financial_year`
2. If `occurred_on` unknown at capture: assign **current FY**, flag `needs_review`
3. User can reassign FY; moves item between FY scopes and triggers readiness recompute
4. Payslips: use period end date for FY unless user overrides

## Helpers (application + SQL)

- `getFinancialYear(date, timezone)` → `YYYY-YY`
- `getCurrentFinancialYear(timezone)` 
- `getFinancialYearRange(fy)` → `{ start: Date, end: Date }`

Default timezone from `profiles.home_timezone` (default `Australia/Sydney`).

## UI

- Global FY switcher in shell (desktop sidebar / phone settings or header)
- Most lists scoped to selected FY
- Cross-FY search available from Evidence with explicit filter
