# Plugin & integration registry (future)

Extensibility pattern shared by: migration importers, bank feeds, ATO prefill, email, calendar, OCR providers, and third-party plugins.

## Registry interface (conceptual)

```ts
interface PlatformAdapter {
  id: string
  kind: 'import' | 'bank' | 'ato' | 'email' | 'calendar' | 'ocr' | 'plugin'
  label: string
  requiredEntitlements?: string[]
  permissions?: string[]
}
```

v1 implements `kind: import` only (`registerImportAdapter` in web app). Server-side registries mirror the same shape in Edge Functions when Supabase ships.

## Plugin manifest (future)

```json
{
  "id": "com.example.receipt-enricher",
  "version": "1.0.0",
  "permissions": ["read_evidence_metadata", "hook_post_ingest"],
  "hooks": {
    "postIngest": "https://plugin.example/hooks/post-ingest"
  }
}
```

Plugins run outside core DB; platform passes signed payloads. Owner approves install per organization.

## Integration accounts (existing pattern)

`integration_accounts` generalizes to:

| Provider kind | Examples |
|---------------|----------|
| `google` | Drive, Calendar |
| `microsoft` | Calendar, email |
| `bank_cdr` | Open Banking AU |
| `ato` | Prefill (credential-bound) |
| `stripe` | Billing (org-level) |

Tokens server-only; clients never receive refresh tokens for third-party services.

## Public API relationship

Public API consumers are **not** plugins — they use versioned REST with scopes. Plugins are first-party or marketplace extensions with declared permissions.

See [Commercial expansion](../architecture/14-commercial-expansion.md).
