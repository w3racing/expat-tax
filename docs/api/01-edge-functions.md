# Edge Functions catalogue

All functions validate auth (JWT) unless invoked by Cron with a shared secret.

| Function | Method | Purpose |
|----------|--------|---------|
| `create-upload` | POST | Mint Blob upload credentials / pathname for user |
| `finalize-upload` | POST | Confirm Blob object, create evidence + job |
| `drive-import` | POST | Import selected Drive file ids into Blob + evidence |
| `google-oauth-callback` | GET/POST | Persist Drive tokens (if not fully via Supabase) |
| `process-evidence` | POST | Worker: OCR/classify/extract (also invoked internally) |
| `recompute-readiness` | POST | Recompute FY readiness snapshot |
| `export-user-data` | POST | Build export package metadata |
| `delete-account` | POST | Cascading delete + blob cleanup |
| `cron-recover-jobs` | POST | Cron: retry stuck jobs |
| `cron-readiness` | POST | Cron: nightly readiness for active users |

## Auth header patterns

- User: `Authorization: Bearer <supabase_access_token>`
- Cron: `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret`

## Versioning

Functions are additive; breaking changes get new names or explicit `schema_version` in bodies.
