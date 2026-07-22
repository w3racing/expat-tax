# AI ingest API

## Entry

All uploads enqueue `ai_ingest` after Blob finalisation. No bypass path.

| Function | Trigger | Role |
|----------|---------|------|
| `finalize-upload` | Client | Creates evidence + queues ingest |
| `unpack-zip` | Worker | Expands ZIP → child evidence rows + child jobs |
| `parse-csv` | Worker | Structured row ingest or tabular evidence |
| `process-evidence` | Queue | Main AI pipeline |
| `apply-ato-fx` | Sub-step | AUD conversion from rate table |
| `scan-duplicates` | Post-extract | Duplicate linking |
| `ingest-ato-rates` | Cron | Refresh monthly rate table |

## `process-evidence` contract

### Input

```json
{
  "evidenceId": "uuid",
  "evidenceFileId": "uuid",
  "schemaVersion": 2
}
```

### Output

```json
{
  "evidenceId": "uuid",
  "documentType": "receipt",
  "status": "ready",
  "overallConfidence": 0.91,
  "requiresConfirmation": false,
  "extractionId": "uuid",
  "suggestedTaxCategory": "work_travel",
  "vaultFolderKey": "work_expenses_meals",
  "duplicateStatus": "none"
}
```

### Errors

| Code | Meaning |
|------|---------|
| `UNSUPPORTED_MIME` | Type not in allowlist |
| `ZIP_EMPTY` | No processable members |
| `CSV_UNREADABLE` | Parse failure |
| `MODEL_TIMEOUT` | Retryable |
| `RATE_TABLE_MISS` | No ATO rate for currency/month |

## ZIP behaviour

1. Stream-unpack in worker (virus scan hook optional later)
2. Each allowed member → new `evidence_items` + `evidence_files` with `capture_source=upload`, parent reference in metadata
3. Each child queues `process-evidence`
4. Parent ZIP item may archive as container or remain as index-only — product default: parent becomes `other` index with children linked

## CSV behaviour

1. Detect delimiter and headers
2. If clearly financial export (date, amount, description columns) → row-level or file-level evidence per product rule
3. If ambiguous → AI column mapping once, then structured store
4. CSV rarely auto-confirms at `ready` unless confidence very high

## Email attachment behaviour

1. Ingest path stores raw `.eml` or attachment bytes
2. Attachment extraction produces standard file pipeline
3. Email metadata (from, subject, date) enriches extraction context only

## Reprocess

`POST /reprocess-evidence` with `evidenceId` — new extraction version; respects `user_corrected` fields.

## Rate ingestion

`ingest-ato-rates` (cron): fetch published table, upsert `ato_exchange_rates`, log `source_published_at`. Idempotent per month.

## Idempotency

`Idempotency-Key` on finalize and process. Duplicate job delivery must not double-write extractions (use job id fence).
