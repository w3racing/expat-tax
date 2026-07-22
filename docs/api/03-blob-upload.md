# Vercel Blob upload contract

## Goals

- Mobile-friendly direct upload
- User-scoped pathnames
- No service role in the browser

## Proposed flow

1. Client → `create-upload` with `{ filename, mimeType, byteSize, financialYear }`
2. Server checks auth, quota, mime allowlist
3. Returns `{ pathname, uploadToken or clientPutUrl, evidenceDraftId? }`
4. Client uploads bytes to Blob
5. Client → `finalize-upload` with checksum/etag
6. Server verifies object exists, writes `evidence_items` + `evidence_files`, enqueues job

## Pathname convention

```text
evidence/{user_id}/{financial_year}/{evidence_id}/{filename}
```

## Allowlist (v1)

Images: `image/jpeg`, `image/png`, `image/webp`, `image/heic`

Documents: `application/pdf`

Archives: `application/zip`

Structured: `text/csv`, `application/csv`

Email (ingest path): `message/rfc822`, common attachment types above

Max size: **20MB** per file; **100MB** for ZIP (configurable).

Every allowed upload enqueues `ai_ingest` on finalise.

## Download

Prefer authenticated download proxy or short-lived signed URLs; avoid permanent public URLs for tax evidence.
