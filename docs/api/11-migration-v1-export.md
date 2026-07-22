# AJX Tax V1 JSON export contract

## Format

Top-level object validated by the `ajx-tax-v1` adapter.

```json
{
  "exportVersion": "1.0",
  "exportedAt": "2026-06-30T12:00:00.000Z",
  "app": "ajx-tax",
  "appVersion": "1.x",
  "profile": { "id": "uuid", "displayName": "…", "email": "…" },
  "employers": [],
  "evidence": [],
  "payslips": [],
  "trips": [],
  "claims": [],
  "notes": [],
  "tags": []
}
```

## Evidence item (V1)

```json
{
  "id": "uuid-or-string",
  "financialYear": "2025-26",
  "type": "receipt",
  "title": "…",
  "occurredOn": "2026-03-12",
  "amount": 42.5,
  "currency": "AUD",
  "merchant": "…",
  "checksumSha256": "…",
  "fileName": "receipt.jpg",
  "mimeType": "image/jpeg",
  "sourceUrl": "https://…",
  "tags": ["meal"]
}
```

Unknown keys are allowed and stored in `legacy_payload` when imported.

## Validation

- `exportVersion` must be `1.0` or `1.x` semver major 1
- `app` must be `ajx-tax` (case-insensitive)
- Arrays may be empty; missing arrays treated as `[]`
- Invalid rows in an array fail validation with path errors (or soft-skip with report — product default: **fail closed** on schema errors; soft-skip only with explicit “ignore invalid rows” advanced option later)

## Content-Type

`application/json` / `.json`
