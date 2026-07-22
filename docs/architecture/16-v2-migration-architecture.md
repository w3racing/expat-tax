# AJX Tax v2 — Technical Migration Architecture

**Status:** Architecture (pre-implementation)  
**Audience:** Product + engineering  
**Prerequisite reading:** ADRs 001–020, `docs/database/*`, `docs/architecture/07–15`  
**Source of truth for live V1 data:** AJX Calculator (new menu structure) `TaxPlannerState` (`schemaVersion: 2`, localStorage `ajx-tax-planner` / `AJX Tax Backup.json`)

This document is the consolidated plan to transform the working AJX Tax prototype into a standalone commercial SaaS application. **No application code is specified here** — only architecture, schema, migration, and sequencing.

---

## Product posture (updated for v2)

Existing docs position AJX Tax as an **evidence management** platform and explicitly exclude a tax calculation engine from schema v1. Live users, however, rely on a full **tax planner / position engine** inside the Calculator fork.

**v2 decision:** AJX Tax becomes a dual-capability product:

| Capability | Role |
|------------|------|
| **Evidence Vault** | Capture, OCR, durability, versions, audit, accountant collaboration |
| **Tax Position** | Preserve V1 planner maths: income, claims, FX, overseas daily, CGT, offsets, printable summary |

Evidence remains the long-term spine. Tax Position is a **first-class bounded context** that consumes evidence and structured ledger rows, produces traceable summaries (U11–U12), and never silently invents numbers without source attribution.

---

## 1. Target Architecture

### 1.1 Platforms

| Surface | Delivery |
|---------|----------|
| Mobile phone | Responsive PWA (phone shell) |
| iPad / tablet | Responsive PWA (tablet shell) |
| Mac desktop browser | Responsive PWA (desktop shell) |
| Progressive Web App | Installable; offline cache + sync queue |
| Native apps | Future (same API; not Phase 0–4) |

### 1.2 Hosting & infrastructure

```text
GitHub (source / CI)
    │
    ▼
Vercel
  ├── SPA static assets (Vite build)
  ├── Edge Middleware (auth gates, optional)
  ├── Vercel Blob (canonical evidence binaries)
  ├── Vercel Cron (stuck jobs, FX refresh, backups, readiness)
  └── Analytics
         │
         ├──► Supabase
         │      Auth (Google OAuth primary)
         │      Postgres + RLS
         │      Realtime (status / jobs)
         │      Edge Functions (AI ingest, Drive mirror, packages)
         │
         └──► Google
                OAuth (Drive scopes incremental)
                Drive API + Picker
                User-owned Evidence Vault mirror
```

### 1.3 High-level request paths

1. **Interactive app** — Browser → Vercel CDN → Supabase JS (Auth + PostgREST + Realtime). SPA never holds the service role key.
2. **Evidence upload** — Short-lived Blob write → Postgres metadata → async ingest job → AI → Realtime UI update → Drive mirror if connected.
3. **Tax Position mutations** — Client forms → RLS-guarded tables → optional link to evidence versions → recalculated FY summary snapshot (async or sync for small FYs).
4. **Drive import** — Picker → Edge copy into Blob + provenance ids → same ingest pipeline.
5. **Background** — Cron → secured Edge Functions (FX ingest, job recovery, monthly encrypted backups, readiness recompute).

### 1.4 Bounded contexts

| Context | Owns |
|---------|------|
| Identity | Profiles, preferences, OAuth links; future orgs / household |
| Capture | Camera, upload, Drive picker, offline queue |
| Evidence | Items, files, extractions, versions, tags, duplicates |
| Tax Position | Financial years, employment income, destinations, claims, investments, tax summary engine |
| Timeline | Trips, rosters, destination nights (bridges Evidence ↔ Tax Position) |
| Income | Employers, payslips (structured + evidence-linked) |
| Deductions | Claim categories, claim↔evidence bindings |
| Readiness | Completeness scores, missing-evidence hints |
| Audit | ATO package generation, claim traffic lights |
| Accountant | Collaborations, grants, comments, requests, packages |
| Integrations | Google Drive, Blob, FX rates, backups |
| Migration | Import adapters, batches, legacy id map, wizard gate |

### 1.5 Architecture goals → mechanisms

| Goal | Mechanism |
|------|-----------|
| Production quality | ADR-020 / U1–U15 gates; typed contracts; observability |
| Commercial SaaS ready | RLS tenancy → org model (ADR-019); entitlement hooks; API-first domain |
| Secure | Google OAuth; RLS; private Blob; encrypted Drive tokens; accountant read-only originals |
| Scalable | Keyset pagination; FY scoping; Blob not LOBs; async AI; snapshots |
| Maintainable | Feature-first folders; ≤~300 LOC/file; ADRs before code |

### 1.6 Explicit non-goals (near term)

- Next.js SSR/RSC
- Prisma / Redux default store
- Electron / Capacitor in first commercial release
- Auto-lodgement / tax advice
- Full accounting general ledger

---

## 2. Database Design

Conventions: `uuid` PKs, `user_id` on tenant rows, `timestamptz` audit columns, soft delete via `deleted_at` where recovery matters, money as `numeric(12,2)`, FY as text `YYYY-YY` (e.g. `2025-26`). Forward-only Supabase migrations; RLS enabled in the same migration as each tenant table.

### 2.1 Entity relationship (logical)

```text
auth.users 1───1 profiles
                │
                ├──* financial_years
                ├──* destinations / bank_accounts (user reference data)
                ├──* tax_year_settings 1───* employment_income_months
                │                      ├──* destination_nights_months
                │                      ├──* receipt_folders 1───* receipt_folder_lines
                │                      ├──* work_expense_claims
                │                      ├──* flight_claims
                │                      ├──* transport_claims
                │                      ├──* car_km_claims
                │                      ├──* laundry_claims
                │                      ├──* apartment_expense_claims
                │                      ├──* interest_entries
                │                      ├──* dividend_entries
                │                      ├──* rental_property_entries
                │                      ├──* capital_gain_entries
                │                      ├──* other_investment_entries
                │                      └──* tax_year_summaries (materialised)
                │
                ├──* evidence_items 1───* evidence_files
                │                  ├──* evidence_events
                │                  ├──* evidence_extractions
                │                  ├──* evidence_versions 1───* evidence_version_events
                │                  └──* evidence_item_tags
                │
                ├──* employers 1───* payslips
                ├──* trips 1───* trip_legs
                ├──* deduction_claims ←→ evidence_versions (bindings)
                ├──* readiness_snapshots
                ├──* integration_accounts / drive_folders
                ├──* processing_jobs
                ├──* backup_snapshots
                ├──* import_batches / legacy_id_map
                └──* accountant_collaborations (+ grants, comments, requests, packages)
```

### 2.2 Identity & reference

#### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `= auth.users.id` |
| `display_name` | text | |
| `avatar_url` | text | nullable |
| `occupation_segment` | text | pilot, cabin_crew, fifo, consultant, traveller, other |
| `home_timezone` | text | default `Australia/Sydney` |
| `preferred_fy` | text | nullable |
| `onboarding_completed_at` | timestamptz | |
| `migration_completed_at` | timestamptz | |
| `migration_wizard_enabled` | boolean | |
| `migration_last_batch_id` | uuid | nullable |
| `created_at` / `updated_at` | timestamptz | |

#### `financial_years`

Logical FY container (optional explicit row; may be derived from activity). Preferred for settings and locks.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `label` | text | `2025-26` unique per user |
| `fy_end_year` | int | e.g. `2026` (preserves V1 keying) |
| `is_active` | boolean | |
| `locked_at` | timestamptz | nullable EOFY lock |
| `created_at` / `updated_at` | timestamptz | |

#### `destinations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `name` | text | |
| `default_currency` | text | nullable ISO |
| `sort_order` | int | |
| `legacy_id` | text | nullable |
| `deleted_at` | timestamptz | |

#### `bank_accounts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `label` | text | |
| `institution` | text | nullable |
| `sort_order` | int | |
| `legacy_id` | text | nullable |

### 2.3 Tax Position tables

#### `tax_year_settings`

One row per user FY (maps `TaxYearRecord` scalars + overseas table preference).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | `2025-26` |
| `fy_end_year` | int | |
| `superannuation_aud` | numeric(12,2) | |
| `overseas_daily_override_aud` | numeric(12,2) | nullable |
| `include_medicare_levy` | boolean | |
| `overseas_ato_salary_table` | text | TD table id (e.g. `6`/`7`/`8`) |
| `notes` | text | |
| `import_batch_id` | uuid | nullable |
| `provenance_source` | text | nullable |
| `legacy_payload` | jsonb | unsupported fields |
| Unique | `(user_id, financial_year)` | |

#### `destination_rates`

Per FY daily AUD rates (from V1 `ratesByFy`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | |
| `destination_id` | uuid FK | |
| `daily_rate_aud` | numeric(12,2) | |
| Unique | `(user_id, financial_year, destination_id)` | |

#### `employment_income_months`

Maps `MonthlyIncome`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | |
| `month_key` | text | `YYYY-MM` |
| `income_usd_5th` | numeric(12,2) | |
| `income_usd_20th` | numeric(12,2) | |
| `income_usd_total` | numeric(12,2) | denormalised |
| `usd_aud_rate` | numeric(18,8) | units per A$1 |
| `usd_aud_from_ato` | boolean | |
| `amount_aud` | numeric(12,2) | computed / stored for audit |
| `payslip_evidence_ids` | uuid[] | optional links |
| Unique | `(user_id, financial_year, month_key)` | |

#### `destination_nights_months`

Maps `monthAway` / destination nights.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | |
| `month_key` | text | |
| `destination_id` | uuid FK | |
| `nights` | int | |
| Unique | `(user_id, financial_year, month_key, destination_id)` | |

#### `receipt_folders` + `receipt_folder_lines`

Maps destination meal/incidental folders.

| `receipt_folders` | Notes |
|-------------------|-------|
| `destination_id`, `month_key`, `date_ymd`, `currency_code` | |
| `locked`, `locked_at` | substantiation lock |
| `financial_year` | |

| `receipt_folder_lines` | Notes |
|------------------------|-------|
| `folder_id`, `date_ymd`, `amount`, `description` | |
| `evidence_id` / `evidence_version_id` | nullable until vault linked |

#### Claim tables (shared FX pattern)

Common columns on work / flight / transport / laundry / apartment claims:

`id`, `user_id`, `financial_year`, `date_ymd`, `description`/`item`, `currency_code`, `local_amount`, `exchange_rate`, `amount_aud`, `work_percentage`, `manual_aud`, `rate_from_ato`, `exchange_rate_month`, `legacy_id`, `import_batch_id`, `evidence_version_id` (nullable), `created_at`, `updated_at`, `deleted_at`.

| Table | Extra columns |
|-------|---------------|
| `work_expense_claims` | `item` |
| `flight_claims` | — |
| `transport_claims` | `kind` (`bus`/`train`/`taxi`), `month_key` |
| `car_km_claims` | `kilometres`, `cents_per_km` (snapshotted) |
| `laundry_claims` | typically JPY |
| `apartment_expense_claims` | `kind` (`rent`/`water`/`gas`/`electricity`) |

#### Investment tables

| Table | Key fields |
|-------|------------|
| `interest_entries` | `bank_account_id`, amounts, TFN withheld |
| `dividend_entries` | franked / unfranked / franking credits / TFN |
| `rental_property_entries` | property label, gross rent, expenses |
| `capital_gain_entries` | `asset_kind`, proceeds, cost base, `discount_eligible` |
| `other_investment_entries` | managed fund / trust / foreign; `foreign_tax_paid_aud` |

#### `tax_year_summaries`

Materialised calculation output (Audit Mode / print / dashboard). Every figure carries audit metadata in `line_items` jsonb: source row ids, FX rate + month, formula key, computed_at, actor.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `financial_year` | text | |
| `engine_version` | text | pin V1 parity builds |
| `summary` | jsonb | mirrors `TaxYearSummary` |
| `line_items` | jsonb | traceability |
| `computed_at` | timestamptz | |
| Unique | `(user_id, financial_year, engine_version)` or latest-only with history table |

#### `ato_exchange_rates`

| Column | Type | Notes |
|--------|------|-------|
| `currency_code` | text | |
| `year` | int | |
| `month` | int | 1–12 |
| `units_per_aud` | numeric | ATO monthly average |
| `source_version` | text | |
| Unique | `(currency_code, year, month, source_version)` | |

### 2.4 Evidence Vault tables

As specified in `docs/database/01-schema.md`, `05-evidence-vault.md`, `06-ai-extractions.md`, `07-document-versions.md`:

- `evidence_items`, `evidence_files`, `evidence_events`, `evidence_extractions`
- `tags`, `evidence_item_tags`
- `evidence_versions`, `evidence_version_events`
- `evidence_sync_events`, `evidence_archive_records`, `evidence_duplicate_links`
- `drive_folders`, `backup_snapshots`
- `processing_jobs`
- `employers`, `payslips`, `trips`, `trip_legs`
- `deduction_claims`, `deduction_claim_evidence`
- `readiness_snapshots`
- `integration_accounts` (+ public view without tokens)

Enums: `document_type`, `evidence_status`, `capture_source`, `deduction_category`, `trip_purpose`.

### 2.5 Migration & collaboration tables

- `import_batches`, `legacy_id_map` — see §3
- Accountant: collaborations, grants, comments, document requests, packages, `accountant_audit_events` — see `docs/database/09-accountant-mode.md`
- Audit Mode artefacts — see `docs/database/10-audit-mode.md`

### 2.6 Relationships (rules)

1. Tax claim rows **may** reference `evidence_version_id` (preferred) or remain numeric-only until evidence exists (migrated V1 data).
2. Payslips link `employer_id` + optional `evidence_id`.
3. Deduction workspace bindings **require** `evidence_version_id` for Audit Mode completeness.
4. Soft-deleted evidence excluded from default queries; archive records prevent permanent loss within retention.
5. Future: nullable `organization_id` on all tenant tables (ADR-019) without breaking B2C RLS.

### 2.7 Indexes (minimum)

| Index | Purpose |
|-------|---------|
| `(user_id, financial_year, deleted_at)` on evidence + all claim tables | FY lists |
| `(user_id, status)` on evidence / jobs | queues |
| `(user_id, kind, financial_year)` on evidence | filters |
| `(user_id, month_key)` on employment / nights | calendar |
| Unique legacy maps `(user_id, entity_type, legacy_id)` | idempotent import |
| Partial unique current version `(evidence_id) WHERE state = 'current'` | version ledger |
| `(user_id, checksum_sha256)` on versions/files | duplicate scan |
| Keyset: `(user_id, created_at, id)` | infinite scroll |

Never load full multi-year history into the client (U15).

### 2.8 Security policies (RLS)

| Table family | Policy |
|--------------|--------|
| All owner tenant tables | `user_id = auth.uid()` for SELECT/INSERT/UPDATE/DELETE |
| `profiles` | own row; insert via trigger on signup |
| `integration_accounts` | no client SELECT of token columns; public view only |
| `processing_jobs` | user SELECT; writes via service role / security definer |
| `ato_exchange_rates` | authenticated READ; writes service role |
| Accountant tables | SELECT evidence when collaboration active + grant; INSERT limited to comments/requests; **no** UPDATE on owner evidence/versions |
| Service role | Edge Functions only |

Realtime publications limited to status tables the UI must subscribe to; RLS still applies.

---

## 3. Data Migration Strategy

### 3.1 The schema mismatch (must solve first)

| Source | Shape |
|--------|-------|
| **Live V1** | `TaxPlannerState` / `AJX Tax Backup.json` — planner blob, `fyEndYear` ints, nested claim arrays |
| **Current wizard contract** | `ajx-tax-v1` evidence-centric export (`exportVersion`, `evidence[]`, `claims[]`) — **does not match** live backups |

**Decision:** Ship two adapters under one wizard:

1. `ajx-calculator-tax-planner-v2` — primary path for real users (parse `TaxPlannerState`)
2. `ajx-tax-v1` — keep for sample / future evidence-native exports

Optional later: Calculator emits a dual export (planner + evidence pack).

### 3.2 Mapping (`TaxPlannerState` → Postgres)

| V1 field | Target |
|----------|--------|
| `schemaVersion` | validate `== 2` (accept known prior with normalisers) |
| `destinations[]` | `destinations` + `legacy_id_map` |
| `bankAccounts[]` | `bank_accounts` |
| `ratesByFy[fyEndYear]` | `destination_rates` (`fyEndYear` → `financial_year` label) |
| `activeFyEndYear` | `profiles.preferred_fy` / `financial_years.is_active` |
| `overseasAtoSalaryTable` | `tax_year_settings.overseas_ato_salary_table` (per user; apply to years or profile preference) |
| `years[].fyEndYear` | `financial_years` + `tax_year_settings` |
| `monthlyIncome[]` | `employment_income_months` |
| `monthAway[]` | `destination_nights_months` |
| `receiptFolders[]` | `receipt_folders` + `receipt_folder_lines` |
| `otherClaims[]` | `work_expense_claims` |
| `flights[]` | `flight_claims` |
| `transport[]` | `transport_claims` |
| `carKm[]` | `car_km_claims` |
| `laundry[]` | `laundry_claims` |
| `apartmentCosts[]` | `apartment_expense_claims` |
| `interestByAccount[]` | `interest_entries` |
| `dividends[]` | `dividend_entries` |
| `rentalProperties[]` | `rental_property_entries` |
| `capitalGains[]` | `capital_gain_entries` |
| `otherInvestments[]` | `other_investment_entries` |
| `notes` | `tax_year_settings.notes` (+ optional `notes` entities) |
| Unknown keys | `legacy_payload` jsonb on settings / batch |

**FY conversion:** `fyEndYear: 2026` → `financial_year: "2025-26"`.

**FX preservation:** Store snapshotted `exchange_rate`, `rate_from_ato`, and rate month; do not silently recompute historical AUD on import.

**Evidence:** V1 has no binaries. Import creates Tax Position rows with provenance `Imported from AJX Tax Version 1` and `evidence_version_id = null`. User attaches evidence later; Audit Mode flags unsubstantiated claims.

### 3.3 Validation

1. JSON parse + size limits  
2. Adapter detection (`schemaVersion` + shape vs `exportVersion` + `app`)  
3. Zod (or equivalent) structural validation  
4. Business rules: car km ≥ 0; percentages 0–100; currencies known or flagged; FY consistency  
5. Checksum of source file → `import_batches.source_checksum`  
6. Preview counts + sample rows before commit  
7. Duplicate detection via `legacy_id_map` + fuzzy (date + amount + description)

### 3.4 Migration steps (user-facing)

```text
1. Sign in (Google)
2. Upload AJX Tax Backup.json (or Drive restore of that file)
3. Adapter detect → validate → preview
4. Resolve duplicates (skip / replace / keep both)
5. Commit transaction:
     - create import_batches (importing)
     - upsert via legacy_id_map (idempotent)
     - write Tax Position rows + provenance
     - recompute tax_year_summaries (engine_version pinned)
     - mark migration_completed_at; disable wizard
6. Success: show what migrated + CTA to attach evidence / connect Drive
```

Admin may re-enable wizard (`migration_wizard_enabled`) for repair imports.

### 3.5 Rollback strategy

| Layer | Approach |
|-------|----------|
| Pre-commit | Preview only; no writes |
| During commit | Single DB transaction per batch; on failure → `import_batches.status = failed`, no partial legacy maps |
| Post-commit (same session) | “Undo import” deletes rows where `import_batch_id = X` (confirm + typing gate) |
| After user edits | No silent wipe; export-all + support repair; re-import uses skip/replace rules |
| Blob | Migration creates no blobs; nothing to roll back in object storage |
| Drive | Do not auto-write V1 planner JSON into vault; backups use AJX ATO encrypted backups going forward |

Keep original JSON in `import_batches` metadata or private Blob path (encrypted) for audit for N days.

---

## 4. Evidence Architecture

### 4.1 Documents

Logical document = `evidence_items` row. Binary = `evidence_files` + immutable `evidence_versions` chain.

Statuses: `uploaded` → `processing` → `needs_review` | `ready` | `failed` | `archived`.

### 4.2 Metadata

Title, description, `occurred_on`, amounts (original + AUD), merchant, `document_type`, deduction hints, confidence, trip/employer links, `metadata` jsonb, provenance columns.

### 4.3 Storage (tri-location)

| Layer | Role |
|-------|------|
| Supabase | Canonical metadata + audit ledger |
| Vercel Blob | Canonical app binary (OCR, preview, restore independent of Google) |
| Google Drive | User-owned mirror under `AJX ATO/<FY>/…` |

AJX Tax organises; the user owns the Drive copy.

### 4.4 Google Drive links

- `integration_accounts.drive_root_folder_id`, sync cursor, status  
- `drive_folders` map of managed folder ids by `folder_key` + FY  
- `evidence_files` / `evidence_versions`: `drive_file_id`, `drive_revision_id`, `drive_parent_folder_id`, mirror status  
- Sync events append-only for rename / replace / trash / restore / conflict  

Managed tree (see `07-evidence-vault.md`): Income, Travel, Work Expenses, Investments, Rental, Tax Return, Audit Package, Backups.

### 4.5 Versions

- Monotonic `version_number`; exactly one `current`  
- Replace / Drive sync / restore create new versions; never rewrite blobs  
- `evidence_version_events` for claim link, rename, archive, compare  
- Claim bindings pin `evidence_version_id`

### 4.6 Audit history

- `evidence_events` — status transitions  
- `evidence_version_events` — version lifecycle  
- `evidence_sync_events` — Drive  
- `accountant_audit_events` — collaboration  
- Tax summary `line_items` — calculation provenance  

### 4.7 Retention

- Seven-year minimum retention (`retention_until`) aligned to ATO record-keeping expectations  
- Soft delete ≠ purge; archive ledger prevents permanent loss inside window  
- Encrypted monthly `backup_snapshots` under Drive `Backups/` + Blob inventory  
- Account deletion path: export package then purge per privacy policy  

---

## 5. AI Processing Pipeline

### 5.1 Flow

```text
Upload / Drive import / offline flush
  → durable Blob + evidence_items (status=uploaded)
  → enqueue processing_jobs (ingest)
  → intake (MIME, ZIP unpack, CSV)
  → preprocess (PDF rasterise, image normalise)
  → OCR / vision
  → classify → document_type
  → extract fields + per-field confidence
  → FX convert via ato_exchange_rates (month of transaction)
  → suggest tax category / Tax Position draft links
  → duplicate detect (checksum + fuzzy)
  → score_and_route → ready | needs_review | failed
  → mirror Drive + update readiness
```

User never blocks on model latency (U4, U9).

### 5.2 OCR targets

| Document | Extract |
|----------|---------|
| Receipt | date, merchant, currency, amount, GST, location |
| Payslip | employer, period, gross, tax withheld, net |
| Roster | dates, destinations/sectors, duty times |
| Flight receipt / itinerary | flight number, route, fare, dates |
| Dividend / CGT / lease / utility | type-specific fields |

### 5.3 Confidence & approval

- Store overall + field-level confidence on extractions  
- Auto-confirm only above threshold **and** complete required fields  
- Below threshold → `needs_review` with short **why** (U10)  
- User correction wins; reprocess never silently overwrites corrections  
- Optional: approve → create/update Tax Position claim draft linked to version  

### 5.4 Out of scope for AI

Tax liability advice, auto-lodgement, inventing missing substantiation.

---

## 6. Authentication

### 6.1 Users & profiles

- Supabase Auth; **Google OAuth primary**  
- Profile row created on first login (`id = auth.uid()`)  
- Session via Supabase SPA patterns; refresh handled by client SDK  

### 6.2 Permissions (v2 B2C)

| Role | Access |
|------|--------|
| Owner | Full CRUD on own tenant data (within product rules) |
| System (Edge) | Service role for ingest, cron, packages |
| Accountant collaborator | Read evidence + generate packages per grants; comments/requests only; never mutate originals |

### 6.3 Accountant access

Invite → email/magic link or Google → `active` collaboration → Accountant shell. Revocable anytime. All actions audited. No owner Drive tokens shared.

### 6.4 Future household / org accounts

ADR-019: `organizations`, memberships, roles (`owner`, `member`, `advisor`). Household, business, trust, SMSF are org **types**. Schema reserves `organization_id`; v2 ships user-scoped RLS first, expands without rewrite.

---

## 7. Offline Strategy

### 7.1 PWA caching

- Web App Manifest + service worker (Workbox or equivalent)  
- Cache: app shell, design tokens, static assets, ATO FX snapshot (versioned)  
- Network-first for API; cache-first for shell  
- Never cache private evidence binaries in SW long-term without quota policy; prefer IndexedDB for pending uploads  

### 7.2 Offline entries

Allow while offline:

- Draft tax claims / income month edits (IndexedDB)  
- Capture photos/files into pending upload store  
- Read last-cached FY summary and evidence list (stale banner)  

Show clear **Offline** + **Pending sync** states (U4, U7).

### 7.3 Sync queue

Durable queue entries: `{ id, type, payload, idempotency_key, created_at, attempts, last_error }`.

Flush on `online` + auth session: uploads first → metadata → tax mutations → conflict check.

### 7.4 Conflict handling

| Case | Resolution |
|------|------------|
| Create with client temp id | Server assigns UUID; map locally |
| Update same row | Last-write-wins on `updated_at` **or** field merge for drafts; surface conflict sheet if both dirty |
| Evidence replace vs Drive replace | New version both sides; never drop bytes; user picks current |
| Duplicate idempotency key | Treat as success (at-least-once safe) |

Offline is a buffer, not a second source of truth. Supabase remains canonical when online.

---

## 8. Application Structure

Feature-first React layout (extends ADR-002):

```text
src/
├── app/
│   ├── providers/          # Query, Auth, Theme
│   ├── router/
│   └── layouts/            # PhoneLayout, TabletLayout, DesktopLayout
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── migration/          # wizard (exists)
│   ├── dashboard/
│   ├── capture/
│   ├── evidence/
│   ├── evidence-vault/
│   ├── document-versions/
│   ├── timeline/
│   ├── income/             # employers, payslips, employment months
│   ├── tax-position/       # FY, claims, investments, calc, print summary
│   ├── deductions/
│   ├── readiness/
│   ├── audit-mode/
│   ├── accountant/
│   ├── settings/
│   ├── integrations-google/
│   └── offline/            # queue, SW bridge
├── shared/
│   ├── components/         # Skeleton, EmptyState, ConfirmDialog, …
│   ├── hooks/
│   ├── lib/                # supabase, blob, fy, errors, ato-fx
│   ├── schemas/
│   └── types/
├── styles/
└── main.tsx

supabase/
├── migrations/
└── functions/              # process-evidence, drive-sync, backups, packages
```

Each feature: `pages/`, `components/`, `hooks/`, `api/`, `schemas/`, `types/`, `utils/`, public `index.ts` only.

Future monorepo: `packages/domain`, `packages/api-client`, `apps/web`.

---

## 9. Feature Roadmap

Priority order: **foundation → identity → migrate real data → evidence spine → tax position parity → vault/AI depth → collaboration → offline polish**.

### Phase 0 — Foundation (partially done)

- Vite/React/Tailwind/design system  
- Shared U1–U15 primitives + error catalogue  
- Supabase project + core migrations (profiles, evidence, tax position stubs)  
- Device shells  
- Migration wizard **with TaxPlannerState adapter** (upgrade from localStorage-only)

### Phase 1 — Auth & durable import

- Google auth + profiles  
- Import batches → Postgres (not localStorage)  
- Idempotent re-import / undo batch  
- FY switcher + empty states  

### Phase 2 — Tax Position parity (preserve V1)

- All claim/income/investment editors  
- ATO FX table + conversion rules (parity tests vs Calculator)  
- Overseas daily / receipt folder locks  
- Tax calculation engine + accountant print summary  
- JSON export (new format) + import  

**Exit criteria:** Side-by-side parity on fixture backups within agreed tolerance (e.g. $0.01).

### Phase 3 — Capture, AI, Evidence

- Blob upload + processing jobs  
- OCR pipelines (receipt, payslip, roster, flight)  
- Classification, confidence, review sheet  
- Document version history  
- Link evidence versions to tax claims  

### Phase 4 — Evidence Vault & backups

- Drive OAuth + `AJX ATO` bootstrap  
- Mirror + sync + conflict UX  
- Seven-year retention / archive  
- Encrypted monthly backups  

### Phase 5 — Audit Mode & Dashboard

- Claim traffic lights  
- Audit package ZIP/PDF/index  
- Readiness + insights snapshots  

### Phase 6 — Accountant Mode

- Invites, grants, shell, comments, requests, packages, audit log  

### Phase 7 — Offline PWA

- Manifest, SW, IndexedDB queue, conflict UI, install prompts  

### Phase 8 — Commercial hardening

- Performance (virtualisation, keyset), quotas, entitlements hooks, org model prep, observability  

---

## 10. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Adapter gap (wizard ≠ live backup) | Users cannot migrate | Prioritise `tax-planner-v2` adapter; fixture tests from real exports |
| Calc drift vs Calculator | Trust loss | Pin `engine_version`; golden-file tests; shared formula module extractable from V1 |
| Dual product confusion (evidence vs calculator) | Scope creep / UX clutter | Clear IA: Capture → Evidence → Position → Audit; Tax Position never invents untraceable numbers |
| Drive API quotas / outages | Mirror lag | Blob canonical; queue retries; sync status UX |
| AI cost & latency | Unit economics | Async; MIME gates; model tiers; cache extractions |
| OCR error → wrong claims | Tax risk | Confidence gates; human approval; never auto-lodge |
| Offline conflicts | Data loss fear | Idempotency keys; version rows; explicit conflict UI |
| RLS mistakes | Data leak | Policy tests; no service key in SPA; accountant grant matrix tests |
| PII to model providers | Privacy | Minimise payload; DPA; AU retention docs |
| Seven-year storage cost | Margin | Lifecycle tiers; archive cold storage; compress packages |
| FY keying bugs (`2026` vs `2025-26`) | Wrong year data | Single conversion helper; DB check constraints |
| Mobile Safari PWA limits | Broken offline | Feature-detect; degrade gracefully; no false “synced” |
| Scope: household/org too early | Delay launch | Ship B2C RLS; reserve columns only |

---

## 11. Decisions

| Decision | Why |
|----------|-----|
| **SPA (Vite) on Vercel + Supabase** (ADR-001) | Interactive capture app; Auth + RLS Postgres + Edge jobs without Next.js complexity |
| **Dual capability: Evidence + Tax Position** | Preserves working V1 value while building commercial evidence SaaS |
| **Tax calculation in-product (schema expansion)** | Explicit user requirement; Audit/Accountant need traceable summaries |
| **Two migration adapters** | Real backups are `TaxPlannerState`; evidence export is a different contract |
| **FY label `YYYY-YY` + store `fy_end_year`** | Product convention + lossless V1 mapping |
| **Snapshot FX rates on rows** | Historical AUD must not change when ATO tables update |
| **Tri-location Evidence Vault** (ADR-011) | Durability + user ownership + app features independent of Google |
| **Vercel Blob as canonical binary** | Predictable OCR/preview/restore |
| **Google OAuth primary; Drive scopes incremental** (ADR-003) | Trust + least privilege |
| **Async AI for every document** (ADR-012) | Capture UX never waits; confidence + why for trust |
| **Immutable version ledger** (ADR-013) | Audit-ready; no silent overwrite |
| **Owner-centric RLS → future orgs** (ADR-010/019) | Ship B2C now; commercial expansion without rewrite |
| **Accountant read-safe only** (ADR-015) | Collaboration without custody risk |
| **Feature-first folders** (ADR-002) | Maintainability; future native clients |
| **PWA before native** | One codebase for phone/iPad/Mac; native later via same API |
| **Offline = queue, not second DB** | Avoid split-brain; Supabase canonical online |
| **Parity tests before AI linking** | Protect financial correctness before automation |
| **Post-migration backups = AJX ATO encrypted**, not V1 JSON Drive file | Clean cutover; vault is the backup story |
| **Standards U1–U15 non-negotiable** (ADR-020) | Premium commercial SaaS bar |

---

## Appendix A — V1 feature → v2 home

| V1 feature | v2 home |
|------------|---------|
| Financial years | `financial_years` + Tax Position UI |
| Employment income + USD/AUD | `employment_income_months` + ATO FX |
| Overseas travel / destination nights | nights + rates + receipt folders |
| Receipt folders | `receipt_folders` (+ later evidence links) |
| Work expenses / flights / transport / car km / apartment | claim tables |
| Investments / dividends / rental / CGT | investment tables |
| Tax calculation + print summary | `tax_year_summaries` + print / Audit |
| JSON export/import | new export + migration adapters |
| Google Drive tax backup | replaced by Evidence Vault + encrypted backups |

## Appendix B — Related documents

- `docs/architecture/02-system-architecture.md`  
- `docs/architecture/07-evidence-vault.md`  
- `docs/architecture/08-ai-processing.md`  
- `docs/architecture/11-accountant-mode.md`  
- `docs/architecture/12-audit-mode.md`  
- `docs/architecture/13-migration-wizard.md`  
- `docs/database/01-schema.md` (+ 02–11)  
- ADRs 001–020  

## Appendix C — Immediate next architecture actions (no app code yet)

1. Accept this document (and a short ADR-021: Tax Position context + planner adapter).  
2. Extend `docs/database/01-schema.md` to include Tax Position tables (remove “out of schema: tax calculation”).  
3. Specify `ajx-calculator-tax-planner-v2` adapter contract beside `docs/api/11-migration-v1-export.md`.  
4. Define calc parity fixtures from real `AJX Tax Backup.json` samples.  
5. Only then implement Phase 0/1 migrations and adapter.
