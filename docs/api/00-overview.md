# API overview

AJX Tax uses a **backend-for-frontend** mix:

1. **Supabase PostgREST** — primary CRUD under RLS
2. **Supabase Edge Functions** — secrets, AI, Drive import, Blob orchestration
3. **Vercel Cron → secured HTTP endpoints** — scheduled work
4. **Google APIs** — OAuth, Drive, Picker (client + server)

No public third-party REST API in v1.

## Documents

| Doc | Topic |
|-----|-------|
| [01-edge-functions.md](./01-edge-functions.md) | Function catalogue |
| [02-google-apis.md](./02-google-apis.md) | OAuth, Drive, Picker |
| [03-blob-upload.md](./03-blob-upload.md) | Vercel Blob contracts |
| [04-cron-jobs.md](./04-cron-jobs.md) | Scheduled tasks |
| [05-error-conventions.md](./05-error-conventions.md) | Errors & idempotency |
| [06-evidence-vault-sync.md](./06-evidence-vault-sync.md) | Drive mirroring, sync, archive, backups |
| [07-ai-ingest.md](./07-ai-ingest.md) | AI pipeline, ZIP/CSV, FX, duplicates |
| [08-document-versions.md](./08-document-versions.md) | Replace, archive, restore, compare, audit export |
| [09-accountant-mode.md](./09-accountant-mode.md) | Invite, grants, packages, audit trail |
| [10-audit-mode.md](./10-audit-mode.md) | Generate ATO audit package artefacts |
| [11-migration-v1-export.md](./11-migration-v1-export.md) | V1 JSON export contract |
| [12-integrations-plugins.md](./12-integrations-plugins.md) | Adapter registry & plugins (future) |
