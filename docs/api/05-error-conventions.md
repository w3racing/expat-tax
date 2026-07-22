# Error & idempotency conventions

## Error shape (Edge Functions)

```json
{
  "error": {
    "code": "UPLOAD_TOO_LARGE",
    "message": "File exceeds the 20MB limit.",
    "requestId": "…"
  }
}
```

## HTTP mapping

| Code | Status |
|------|--------|
| Validation | 400 |
| Auth | 401 |
| Forbidden | 403 |
| Not found | 404 |
| Rate limit | 429 |
| Upstream (Google/Blob/AI) | 502 |
| Unexpected | 500 |

## Idempotency

- `finalize-upload` and `drive-import` accept `Idempotency-Key`
- Workers process each `processing_jobs.id` once logically; retries allowed

## Client handling

- TanStack Query maps errors to calm toasts
- Never show raw stack traces
