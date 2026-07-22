# Audit Mode API

## Endpoints

| Function | Actor | Purpose |
|----------|-------|---------|
| `get-audit-overview` | Owner / accountant | Claim traffic lights + counts for FY |
| `get-audit-claim` | Owner / accountant | Claim detail + every linked document |
| `recompute-audit-claims` | System / owner | Refresh traffic lights |
| `create-audit-package` | Owner / accountant* | Start generation |
| `get-audit-package` | Owner / accountant* | Status + download descriptors |
| `list-audit-packages` | Owner / accountant* | History |
| `download-audit-artefact` | Owner / accountant* | Signed URL; audited |

\*Accountant requires `generate_audit_package` (and read). Downloads audited.

## `create-audit-package`

```json
{
  "financialYear": "2025-26",
  "includeHistoricalVersions": false,
  "includeAccountantNotes": true,
  "includeTaxCalculations": true
}
```

Response:

```json
{
  "auditPackageId": "uuid",
  "status": "queued"
}
```

## `get-audit-claim`

Returns:

- status + label (green/yellow/red)
- missing_reasons
- linked documents array: evidence id, title, type, date, amount, version number, checksum, drive file id, preview URL

## Artefacts when `ready`

- `summaryPdf`
- `timelinePdf`
- `evidenceIndexCsv`
- `evidenceIndexPdf`
- `zip`

## Guarantees

- Generation is idempotent per request id
- Partial failure → `failed`, no `ready` with incomplete zip
- Cover PDF always includes suitability / disclaimer statements
- Tax calculation section labelled as working papers / indicative
