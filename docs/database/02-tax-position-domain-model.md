# Tax Position Domain Model

**Status:** Canonical — authoritative data model for the Tax Position bounded context  
**Product:** AJX Tax v2  
**Related:** [ADR-021](../decisions/ADR-021-tax-position-domain.md) · [v2 migration architecture §2](../architecture/16-v2-migration-architecture.md) · [Planner adapter contract](../migration/planner-adapter-contract.md) · [Evidence Vault](./05-evidence-vault.md) · [Audit Mode](./10-audit-mode.md) · [Organizations (future)](./12-organizations-future.md) · [Parity gate](../testing/tax-calculation-parity.md)

This document defines the complete logical and physical data model for Tax Position. It does not define application code, UI, or API handlers.

---

## 1. Domain Overview

### 1.1 What Tax Position represents

**Tax Position** is the authoritative, financial-year-scoped calculation domain in AJX Tax. It holds the living working papers for a taxpayer (or entity): income, claims, travel and FX inputs, investments, year settings, and indicative tax summaries.

It answers:

- What is being claimed this year?
- How was each figure computed or entered?
- What evidence supports it (if any)?
- What is the current indicative tax stance for this FY?

Tax Position is a **first-class bounded context** (ADR-021). It is not a UI view, not a PDF section, and not a derived report over Evidence Vault.

### 1.2 What belongs inside Tax Position

| Area | Ownership |
|------|-----------|
| FY containers and year settings | Settings that drive calculation (super, Medicare levy, overseas daily override, TD salary table) |
| Structured income ledgers | Employment (incl. foreign-currency pay), interest, dividends, rental, CGT, other investments |
| Structured claim ledgers | Work expenses, flights, transport, car km, laundry, apartment costs, meal/incidental folders |
| Travel maths inputs (MVP spine) | Overnight counts (destination × month — source of truth), sample days + receipts, average daily spend applied to qualifying overnights; legacy destination daily rates / receipt folders retained for Calculator continuity ([ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md)) |
| Currency conversion inputs | Snapshotted FX on rows; reference ATO monthly rates |
| Calculation outputs | Versioned engine runs and materialised FY summaries with line-level provenance |
| Provenance & migration | Source, import batch, legacy ids, actor/time on every material row |
| Optional evidence links | Soft FKs to Evidence Vault versions without owning binaries |

### 1.3 What does not belong inside Tax Position

| Area | Owner instead |
|------|----------------|
| Document binaries, Drive mirror, versions, retention, backups | Evidence Vault |
| OCR / AI extraction payloads and draft suggestions | Evidence extractions / AI pipeline (suggestions only until accepted into Position) |
| Lodgement to the ATO | Out of product scope |
| Personalised tax advice | Out of product scope |
| Full accounting general ledger / chart of accounts | Out of product scope |
| Accountant collaboration grants, comments, package jobs | Accountant Mode tables |
| Audit package ZIP/PDF artefacts and traffic-light materialisations | Audit Mode tables (consumes Position + vault) |
| Billing, entitlements, org membership | Organizations / commercial layer |

**Bridge rule:** Timeline artefacts (trips, rosters, payslips as evidence) live in Evidence / Timeline tables and **link into** Position; they do not replace Position ledgers.

### 1.4 Capability requirements this model must satisfy

| Requirement | Model consequence |
|-------------|-------------------|
| AJX Calculator parity | Tables and fields map 1:1 to `TaxPlannerState` / `TaxYearRecord` semantics; summaries pin `engine_version` |
| Future Evidence Vault linking | Nullable `evidence_version_id` (and arrays where multi-doc) on Position rows; binding tables for workspace deductions |
| Accountant review | Read-safe FY Position + summary snapshots; no mutation of originals via accountant paths |
| Audit Mode | Claims remain first-class even when unsubstantiated; completeness scored against links |
| Multi-year history | All ledgers keyed by `financial_year`; soft delete; summary history by engine version |
| Multiple users | `user_id` tenancy + RLS today; future `organization_id` without rewriting ledgers |
| Multiple entities | Org types (personal / family / business / trust / SMSF) scope Position; entity rules attach to settings, not vault blobs |

---

## 2. Core Entities

Logical entities below map to one or more physical tables. Names in **bold** are domain concepts; table names are physical.

### 2.1 Tax Year

**Meaning:** One Australian financial year (1 July – 30 June) for a tenant. The unit of calculation, lock, and summary.

**Physical:**

| Table | Role |
|-------|------|
| `financial_years` | Explicit FY container (label, lock, active flag) |
| `tax_year_settings` | Per-FY calculation scalars (super, Medicare, overseas override, TD table, notes) |

**Key rules:**

- Label format `YYYY-YY` (e.g. `2025-26`); also store `fy_end_year` int for V1 keying parity.
- One `tax_year_settings` row per `(user_id, financial_year)`.
- Optional `locked_at` on `financial_years` freezes EOFY edits (product policy).
- Multi-year history = many FY rows; never overwrite prior years in place when importing another FY.

### 2.2 Taxpayer Profile

**Meaning:** Who the Position belongs to and the durable preferences / reference data that span years.

**Physical:**

| Table | Role |
|-------|------|
| `profiles` | Auth-linked person: display name, occupation segment, timezone, preferred FY, migration flags |
| `destinations` | User destination catalogue (travel / overseas daily) |
| `bank_accounts` | Interest account catalogue |
| `employers` | Employment catalogue (multi-employer ready) |

**Key rules:**

- Profile is identity; Position ledgers are FY-scoped under the same tenant.
- Reference catalogues (`destinations`, `bank_accounts`, `employers`) are cross-FY; rates and income rows are FY-scoped.
- Future organization entities add `organizations` + membership; Position rows gain `organization_id` (see §8).

### 2.3 Employment Income

**Meaning:** Employment remuneration for the FY, including foreign-currency pay converted to AUD with snapshotted FX.

**Physical:** `employment_income_months`

**Key rules:**

- One row per `(user_id, financial_year, month_key)` where `month_key` is `YYYY-MM` in the Jul–Jun set for that FY.
- V1 parity: `income_usd_5th`, `income_usd_20th`, denormalised `income_usd_total`, `usd_aud_rate` (units of USD per A$1), `usd_aud_from_ato`, stored `amount_aud`.
- Optional `payslip_evidence_ids uuid[]` for Evidence Vault payslip versions.
- Multi-employer expansion: add `employer_id` (nullable at first for V1 parity) without splitting month uniqueness until product requires per-employer months — see §8.

### 2.4 Foreign Income

**Meaning:** Income earned outside Australia or denominated in foreign currency that contributes to the FY Position. Not a single table — a **domain grouping** over:

| Source | Table / fields |
|--------|----------------|
| Foreign employment (USD pay) | `employment_income_months` (USD + FX → AUD) |
| Foreign / managed / trust distributions | `other_investment_entries` (`kind`, `gross`, `foreign_tax_paid_aud`) |
| Foreign components of CGT / dividends | Relevant investment tables when currency ≠ AUD or foreign tax present |

**Key rules:**

- Foreign income is always expressible as AUD with FX provenance (rate, month, ATO vs manual).
- Do not invent a parallel “foreign total” table; summaries aggregate from ledgers.
- Audit Mode may treat foreign income months / investment rows as claim-like units for evidence traffic lights.

### 2.5 Deductions

**Meaning:** User-facing deduction **workspace** groupings for an FY (category rolls, labels, notes) used by Evidence binding and readiness — distinct from typed claim ledger rows.

**Physical:**

| Table | Role |
|-------|------|
| `deduction_claims` | FY deduction group (category, label, notes, archived) |
| `deduction_claim_evidence` | Required `evidence_version_id` bindings for Audit completeness |

**Key rules:**

- Deduction workspace may aggregate or point at typed Claims (§2.6); it does not replace claim maths.
- Evidence bindings for deductions **require** a version id (stronger than optional links on typed claims).
- Soft-archived deductions excluded from default readiness.

### 2.6 Claims

**Meaning:** Typed, calculable expense / allowance ledger rows that feed the tax engine. These are the V1 Calculator claim arrays.

**Physical claim tables:**

| Table | V1 source | Distinct fields |
|-------|-----------|-----------------|
| `work_expense_claims` | `otherClaims[]` | `item` |
| `flight_claims` | `flights[]` | — |
| `transport_claims` | `transport[]` | `kind` (`bus`/`train`/`taxi`), `month_key` |
| `car_km_claims` | `carKm[]` | `kilometres`, `cents_per_km` (snapshotted) |
| `laundry_claims` | `laundry[]` | typically JPY |
| `apartment_expense_claims` | `apartmentCosts[]` | `kind` (`rent`/`water`/`gas`/`electricity`) |
| `receipt_folders` + `receipt_folder_lines` | meal/incidental folders | destination, lock, line amounts |

**Shared claim pattern (FX-capable rows):**  
`date_ymd`, description/item, `currency_code`, `local_amount`, `exchange_rate`, `amount_aud`, `work_percentage`, `manual_aud`, `rate_from_ato`, `exchange_rate_month`, optional `evidence_version_id`, provenance columns, soft delete.

**Key rules:**

- Claims may exist **without** evidence (migration + mid-year entry).
- Stored AUD wins on import mismatch; never silently rewrite historical AUD from a fresh ATO pull.
- Car km annual caps are **calculation-time** rules, not insert constraints (warn in product; store raw km).

### 2.7 Travel Periods (Overnight workflow)

**Meaning:** Time away and destination context for the MVP overnight claim path (ADR-024): overnight counts → sample days → average daily spend → claim. Also retains Calculator-parity structures (destination rates, receipt folders) for migration continuity.

**Physical (MVP spine):**

| Table / concept | Role |
|-----------------|------|
| `destination_nights_months` (overnight table) | **Source of truth** — overnight counts per destination per month (V1 `monthAway`) |
| Sample days + sample-day receipts | **Source of truth** for average daily spend per destination (maps from / replaces product use of receipt folders for MVP UX) |
| Destination average daily snapshot | Computed average from completed sample days; inputs + result versioned |
| Overnight claim on Tax Position | Average × qualifying overnight count, with provenance |
| `destination_rates` | Legacy / alternate daily AUD rates (Calculator parity); not the primary MVP claim path |
| `receipt_folders` / lines | Legacy Calculator meal folders; import must map toward sample days where possible |
| `trips` / `trip_legs` | Timeline bridge only (Evidence domain); **not** calculation authority |

**Key rules:**

- **Overnight table is authoritative** for overnight counts. Rosters and trips never silently overwrite counts.
- **MVP claim path:** completed sample days → average daily spend → apply to qualifying overnights → display on Tax Position.
- Roster evidence substantiates travel; interpretation/parsing is out of MVP (ADR-024).
- If legacy nights × `destination_rates` maths remains for import parity, provenance must label the method; product IA prefers sample-day averages.
- Flight receipt evidence may still link to `flight_claims` or trip legs — see §5.

### 2.8 Currency Conversion

**Meaning:** Conversion of foreign amounts to AUD under ATO / Calculator convention, with immutable snapshots on Position rows.

**Physical:**

| Table | Role |
|-------|------|
| `ato_exchange_rates` | Reference monthly averages (currency, year, month, `units_per_aud`, `source_version`) |
| Claim / income row FX columns | Snapshots used in calculation and audit |

**Authoritative convention:**

> Exchange rate = units of foreign currency per A$1.  
> AUD = foreign_amount ÷ exchange_rate (when rate > 0).

**Key rules:**

- Never invert the formula.
- Historical row rates are not overwritten when ATO reference rates update.
- `manual_aud = true` trusts entered AUD; keep local + rate for audit.
- `rate_from_ato` records whether the snapshotted rate came from ATO tables.

### 2.9 Investment Income

**Meaning:** Non-employment investment income for the FY (excluding dedicated rental and CGT entities, which are first-class below).

**Physical:**

| Table | Key fields |
|-------|------------|
| `interest_entries` | `bank_account_id`, `gross_interest_aud`, `tfn_withheld_aud` |
| `dividend_entries` | franked / unfranked / franking credits / TFN withheld |
| `other_investment_entries` | `kind` (managed fund / trust / foreign / other), gross, `foreign_tax_paid_aud` |

**Key rules:**

- Interest requires resolvable `bank_account_id`.
- Amounts stored in AUD unless a future multi-currency investment ADR extends the model (preserve FX columns if added).

### 2.10 Rental Income

**Meaning:** Rental property gross income and expenses for the FY.

**Physical:** `rental_property_entries`

**Key fields:** property label, gross rent, expenses (structured columns and/or documented jsonb breakdown), FY, provenance, optional evidence links.

**Key rules:**

- One row per property entry (V1 `rentalProperties[]`); multiple properties per FY allowed.
- Future multi-entity: property may attach to a business/trust org without merging into personal ledgers.

### 2.11 Capital Gains

**Meaning:** Capital gains / losses events for the FY.

**Physical:** `capital_gain_entries`

**Key fields:** `asset_kind`, acquisition/disposal dates, proceeds, cost base, `discount_eligible`, computed gain fields as stored by engine or snapshotted inputs, provenance.

**Key rules:**

- `asset_kind` closed allow-list; unknown → `other` on import with report.
- Discount eligibility is an input flag; discount maths lives in the calculation engine and appears in summary line items.

### 2.12 Tax Calculation

**Meaning:** The versioned rules engine that turns Position inputs into indicative outcomes (offsets, overseas daily, CGT helpers, Medicare, brackets, etc.).

**Physical representation:**

| Artefact | Role |
|----------|------|
| `engine_version` (text) | Pinned build id for parity and historical explainability |
| Calculation job metadata (optional `processing_jobs` / dedicated calc jobs) | Long-running recompute progress (U4) |
| Inputs | All FY ledger tables + `tax_year_settings` + `ato_exchange_rates` (read) |

**Key rules:**

- Engine is deterministic for a given `(inputs, engine_version)`.
- Calculations are not ephemeral UI maths; outputs must land in Tax Summary (§2.13).
- Parity gate: V1 Calculator is the reference until superseded by an explicit engine version ADR.

### 2.13 Tax Summary

**Meaning:** Materialised, traceable FY summary — the authoritative presentation of calculation results for print, Audit Mode, dashboard estimates, and accountant working papers.

**Physical:** `tax_year_summaries`

**Key fields:** `summary` jsonb (mirrors `TaxYearSummary`), `line_items` jsonb (per-figure provenance), `engine_version`, `computed_at`, actor metadata.

**Key rules:**

- Unique strategy: either `(user_id, financial_year, engine_version)` or latest-row + history table — product must retain explainability for prior runs.
- Reports and Audit Mode **read** summaries; they must not invent figures absent from Position.
- Labelled **indicative / working paper** in user-facing copy — not lodgement.

---

## 3. Entity Relationships

### 3.1 Logical overview

```text
auth.users 1───1 profiles
                │
                ├──* financial_years
                ├──* destinations
                ├──* bank_accounts
                ├──* employers
                │
                └──* tax_year_settings (1 per FY)
                         │
                         ├──* employment_income_months
                         ├──* destination_nights_months ──► destinations
                         ├──* destination_rates ──────────► destinations
                         ├──* receipt_folders ──* receipt_folder_lines
                         ├──* work_expense_claims
                         ├──* flight_claims
                         ├──* transport_claims
                         ├──* car_km_claims
                         ├──* laundry_claims
                         ├──* apartment_expense_claims
                         ├──* interest_entries ──► bank_accounts
                         ├──* dividend_entries
                         ├──* rental_property_entries
                         ├──* capital_gain_entries
                         ├──* other_investment_entries
                         └──* tax_year_summaries

Evidence Vault (separate bounded context)
  evidence_items 1───* evidence_versions
       │
       └── optional links ◄── Position claim / income / folder rows
       └── required links ◄── deduction_claim_evidence

Timeline bridge
  employers 1───* payslips (optional evidence_id)
  trips 1───* trip_legs (optional evidence_id)
```

### 3.2 Cross-domain bridge

```text
Documents ──► Evidence Vault ──► (optional evidence_version_id) ──► Tax Position
                                       │
Typed claims / income rows ────────────┤
                                       ▼
                               Tax Calculation
                                       │
                                       ▼
                                Tax Summary
                                       │
                     ┌─────────────────┼─────────────────┐
                     ▼                 ▼                 ▼
                  Reports         Audit Mode      Accountant Mode
```

### 3.3 Cardinality summary

| From | To | Cardinality | Notes |
|------|----|-------------|-------|
| Profile / tenant | Tax Year | 1 : * | Multi-year history |
| Tax Year settings | Employment month | 1 : * | Unique month_key |
| Tax Year settings | Each claim type | 1 : * | Soft-deletable |
| Destination | Nights / rates / folders | 1 : * | FY-scoped children |
| Bank account | Interest entries | 1 : * | Per FY |
| Claim / income row | Evidence version | * : 0..1 (or 0..n via array/binding) | Optional until linked |
| Deduction claim | Evidence version | * : * via binding | Version required |
| Tax Year | Tax Summary | 1 : * | Per engine_version / history |

---

## 4. Database Mapping

Conventions (from [00-overview](./00-overview.md)):

- `uuid` PKs (`gen_random_uuid()`)
- `created_at` / `updated_at` timestamptz on mutable tables
- `user_id uuid not null` on tenant tables (future: + `organization_id`)
- Soft delete via `deleted_at` where recovery matters
- Money as `numeric(12,2)` unless noted; FX rates as `numeric(18,8)` where precision required
- FY as `text` `YYYY-YY`
- RLS enabled in the same migration as each tenant table

Shared provenance columns on imported / ledger rows (see §6):  
`provenance_source`, `provenance_label`, `imported_at`, `legacy_id`, `import_batch_id`, `legacy_payload` (jsonb), plus actor fields where mutations are audited.

---

### 4.1 `financial_years` — Tax Year container

**Purpose:** Explicit FY row for locks, active selection, and migration mapping.

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | RLS |
| `label` | text | ✓ | `2025-26` |
| `fy_end_year` | int | ✓ | e.g. `2026` |
| `is_active` | boolean | ✓ | UI default year |
| `locked_at` | timestamptz | | EOFY lock |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** unique `(user_id, label)`; `(user_id, is_active)`.

**Constraints:** `label` matches `YYYY-YY`; `fy_end_year` consistent with label.

---

### 4.2 `profiles` — Taxpayer Profile (person)

**Purpose:** Extends auth user with product preferences.

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | `= auth.users.id` |
| `display_name` | text | | |
| `avatar_url` | text | | |
| `occupation_segment` | text | | pilot, cabin_crew, fifo, consultant, traveller, other |
| `home_timezone` | text | ✓ | default `Australia/Sydney` |
| `preferred_fy` | text | | |
| `onboarding_completed_at` | timestamptz | | |
| `migration_completed_at` | timestamptz | | |
| `migration_wizard_enabled` | boolean | | |
| `migration_last_batch_id` | uuid | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** PK only for core; optional `(preferred_fy)`.

---

### 4.3 `destinations` / `bank_accounts` / `employers` — Profile reference data

#### `destinations`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `name` | text | ✓ | |
| `default_currency` | text | | ISO |
| `sort_order` | int | ✓ | default 0 |
| `legacy_id` | text | | |
| `deleted_at` | timestamptz | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** `(user_id, deleted_at)`; unique `(user_id, legacy_id)` where legacy not null.

#### `bank_accounts`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `label` | text | ✓ | |
| `institution` | text | | |
| `sort_order` | int | ✓ | |
| `legacy_id` | text | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** `(user_id)`; unique `(user_id, legacy_id)` where applicable.

#### `employers`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `name` | text | ✓ | |
| `abn` | text | | |
| `is_active` | boolean | ✓ | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

---

### 4.4 `tax_year_settings` — Tax Year calculation settings

**Purpose:** Per-FY scalars driving the engine (maps `TaxYearRecord` settings).

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `fy_end_year` | int | ✓ | |
| `superannuation_aud` | numeric(12,2) | ✓ | default 0 |
| `overseas_daily_override_aud` | numeric(12,2) | | |
| `include_medicare_levy` | boolean | ✓ | default true |
| `overseas_ato_salary_table` | text | ✓ | TD table `6`/`7`/`8` |
| `notes` | text | | |
| `import_batch_id` | uuid | | |
| `provenance_source` | text | | |
| `provenance_label` | text | | |
| `imported_at` | timestamptz | | |
| `legacy_payload` | jsonb | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** unique `(user_id, financial_year)`.

**Constraints:** `overseas_ato_salary_table` in allow-list; FK optional to `financial_years` by label+user.

---

### 4.5 `employment_income_months` — Employment Income

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `month_key` | text | ✓ | `YYYY-MM` |
| `income_usd_5th` | numeric(12,2) | ✓ | |
| `income_usd_20th` | numeric(12,2) | ✓ | |
| `income_usd_total` | numeric(12,2) | ✓ | denormalised |
| `usd_aud_rate` | numeric(18,8) | ✓ | USD per A$1 |
| `usd_aud_from_ato` | boolean | ✓ | |
| `amount_aud` | numeric(12,2) | ✓ | snapshotted |
| `payslip_evidence_ids` | uuid[] | | Evidence version ids |
| `employer_id` | uuid | | Future multi-employer; nullable for V1 |
| `import_batch_id` | uuid | | |
| `legacy_id` | text | | |
| Provenance columns | | | §6 |
| `deleted_at` | timestamptz | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** unique `(user_id, financial_year, month_key)` (extend with `employer_id` when multi-employer months ship); `(user_id, financial_year, deleted_at)`.

---

### 4.6 Foreign Income — mapping (no dedicated table)

Foreign income is **queried/aggregated**, not stored as a separate root table:

| Logical slice | Table |
|---------------|-------|
| Foreign employment | `employment_income_months` |
| Foreign / other investments | `other_investment_entries` |
| Summary lines | `tax_year_summaries.line_items` / `summary` |

If product later needs a dedicated `foreign_income_entries` table (e.g. ATO labels beyond V1), introduce via expand migration without removing existing ledgers.

---

### 4.7 `deduction_claims` / `deduction_claim_evidence` — Deductions

#### `deduction_claims`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `category` | deduction_category | ✓ | enum |
| `label` | text | ✓ | |
| `notes` | text | | |
| `is_archived` | boolean | ✓ | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** `(user_id, financial_year, is_archived)`.

#### `deduction_claim_evidence`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `claim_id` | uuid | ✓ | FK deduction_claims |
| `evidence_id` | uuid | ✓ | |
| `evidence_version_id` | uuid | ✓ | **required** |
| `created_at` | timestamptz | ✓ | |

**Indexes:** unique `(claim_id, evidence_version_id)`; `(user_id, claim_id)`.

---

### 4.8 Claim tables — Claims

**Common columns** (work / flight / transport / laundry / apartment; car km shares most except FX fields where N/A):

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `date_ymd` | text/date | ✓ | Prefer `date`; text allowed for V1 parity |
| `description` or `item` | text | | Table-specific |
| `currency_code` | text | ✓ | ISO |
| `local_amount` | numeric(12,2) | ✓ | |
| `exchange_rate` | numeric(18,8) | | |
| `amount_aud` | numeric(12,2) | ✓ | |
| `work_percentage` | numeric(5,2) | | 0–100 |
| `manual_aud` | boolean | ✓ | |
| `rate_from_ato` | boolean | ✓ | |
| `exchange_rate_month` | text | | `YYYY-MM` |
| `evidence_version_id` | uuid | | Optional vault link |
| `legacy_id` | text | | |
| `import_batch_id` | uuid | | |
| Provenance columns | | | §6 |
| `deleted_at` | timestamptz | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Table-specific:**

| Table | Extra columns | Constraints |
|-------|---------------|-------------|
| `work_expense_claims` | `item` | |
| `flight_claims` | — | |
| `transport_claims` | `kind`, `month_key` | `kind` ∈ bus/train/taxi |
| `car_km_claims` | `kilometres`, `cents_per_km` | `kilometres` ≥ 0 |
| `laundry_claims` | — | often `currency_code = JPY` |
| `apartment_expense_claims` | `kind` | rent/water/gas/electricity |

**Indexes (each claim table):** `(user_id, financial_year, deleted_at)`; `(user_id, evidence_version_id)` where not null; unique `(user_id, legacy_id)` when legacy present.

---

### 4.9 Travel Period tables

#### `destination_nights_months`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `month_key` | text | ✓ | |
| `destination_id` | uuid | ✓ | FK |
| `nights` | int | ✓ | ≥ 0 |
| Provenance / import | | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** unique `(user_id, financial_year, month_key, destination_id)`.

#### `destination_rates`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `destination_id` | uuid | ✓ | |
| `daily_rate_aud` | numeric(12,2) | ✓ | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** unique `(user_id, financial_year, destination_id)`.

#### `receipt_folders`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `destination_id` | uuid | ✓ | |
| `month_key` | text | ✓ | |
| `date_ymd` | text | | |
| `currency_code` | text | ✓ | |
| `locked` | boolean | ✓ | |
| `locked_at` | timestamptz | | |
| `legacy_id` | text | | |
| Provenance / import | | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

#### `receipt_folder_lines`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `folder_id` | uuid | ✓ | FK |
| `date_ymd` | text | | |
| `amount` | numeric(12,2) | ✓ | local currency |
| `description` | text | | |
| `evidence_id` | uuid | | |
| `evidence_version_id` | uuid | | |
| `legacy_id` | text | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** `(folder_id)`; `(user_id, evidence_version_id)`.

#### Timeline bridge (Evidence-adjacent)

`trips`, `trip_legs`, `payslips` — see [01-schema](./01-schema.md). Not authoritative for overseas daily maths; support travel evidence and UX.

---

### 4.10 `ato_exchange_rates` — Currency Conversion reference

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `currency_code` | text | ✓ | |
| `year` | int | ✓ | |
| `month` | int | ✓ | 1–12 |
| `units_per_aud` | numeric | ✓ | ATO monthly average |
| `source_version` | text | ✓ | |
| `created_at` | timestamptz | ✓ | |

**Indexes:** unique `(currency_code, year, month, source_version)`.

**Constraints:** Reference data — not user-tenant RLS; read-only to clients via service role or secured views.

---

### 4.11 Investment Income tables

#### `interest_entries`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `bank_account_id` | uuid | ✓ | FK |
| `gross_interest_aud` | numeric(12,2) | ✓ | |
| `tfn_withheld_aud` | numeric(12,2) | ✓ | |
| `evidence_version_id` | uuid | | |
| Provenance / import | | | |
| `deleted_at` | timestamptz | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** `(user_id, financial_year, deleted_at)`; `(bank_account_id)`.

#### `dividend_entries`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `label` / issuer fields | text | | As needed for V1 parity |
| `franked_aud` | numeric(12,2) | ✓ | |
| `unfranked_aud` | numeric(12,2) | ✓ | |
| `franking_credits_aud` | numeric(12,2) | ✓ | |
| `tfn_withheld_aud` | numeric(12,2) | ✓ | |
| `evidence_version_id` | uuid | | |
| Provenance / import | | | |
| `deleted_at` | timestamptz | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** `(user_id, financial_year, deleted_at)`.

#### `other_investment_entries`

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `kind` | text | ✓ | managed_fund / trust / foreign / other |
| `label` | text | | |
| `gross_aud` | numeric(12,2) | ✓ | |
| `foreign_tax_paid_aud` | numeric(12,2) | | |
| `evidence_version_id` | uuid | | |
| Provenance / import | | | |
| `deleted_at` | timestamptz | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** `(user_id, financial_year, kind, deleted_at)`.

---

### 4.12 `rental_property_entries` — Rental Income

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `label` | text | ✓ | property name/address short label |
| `gross_rent_aud` | numeric(12,2) | ✓ | |
| `expenses_aud` | numeric(12,2) | ✓ | or split columns / jsonb breakdown |
| `expense_breakdown` | jsonb | | optional detail |
| `evidence_version_id` | uuid | | primary pack link; multi via binding later |
| Provenance / import | | | |
| `deleted_at` | timestamptz | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** `(user_id, financial_year, deleted_at)`.

---

### 4.13 `capital_gain_entries` — Capital Gains

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `asset_kind` | text | ✓ | allow-list; default `other` |
| `label` | text | | |
| `acquired_on` | date | | |
| `disposed_on` | date | | |
| `proceeds_aud` | numeric(12,2) | ✓ | |
| `cost_base_aud` | numeric(12,2) | ✓ | |
| `discount_eligible` | boolean | ✓ | |
| `evidence_version_id` | uuid | | |
| Provenance / import | | | |
| `deleted_at` | timestamptz | | |
| `created_at` / `updated_at` | timestamptz | ✓ | |

**Indexes:** `(user_id, financial_year, asset_kind, deleted_at)`.

**Constraints:** `asset_kind` check/enum allow-list.

---

### 4.14 Tax Calculation — engine metadata

No separate “calculation result” table beyond summaries. Optional job row:

| Column (on `processing_jobs` or dedicated `tax_calculation_jobs`) | Type | Notes |
|--------|------|-------|
| `user_id` | uuid | |
| `financial_year` | text | |
| `engine_version` | text | |
| `status` | text | queued / running / succeeded / failed |
| `input_fingerprint` | text | hash of input set for cache |
| `error_message` | text | user-safe mapping via catalogue |
| `created_at` / `updated_at` / `completed_at` | timestamptz | |

**Indexes:** `(user_id, financial_year, status)`.

---

### 4.15 `tax_year_summaries` — Tax Summary

| Column | Type | Req | Notes |
|--------|------|-----|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | ✓ | |
| `financial_year` | text | ✓ | |
| `engine_version` | text | ✓ | pin V1 parity builds |
| `summary` | jsonb | ✓ | mirrors `TaxYearSummary` |
| `line_items` | jsonb | ✓ | traceability per figure |
| `computed_at` | timestamptz | ✓ | |
| `computed_by` | uuid | | actor user; null = system |
| `actor_type` | text | ✓ | `user` \| `system` \| `import` |
| `created_at` | timestamptz | ✓ | |

**Indexes:** unique `(user_id, financial_year, engine_version)` **or** unique latest `(user_id, financial_year)` plus `tax_year_summary_history` for prior runs.

**Constraints:** `summary` and `line_items` must be non-null on success; failed calcs do not overwrite last good summary without explicit policy.

**`line_items` entry shape (logical):**

```text
{
  key, label, amount_aud,
  source_table, source_row_ids[],
  fx: { currency, rate, month, rate_from_ato, manual_aud },
  formula_key, engine_version,
  computed_at, actor_type, actor_user_id
}
```

---

### 4.16 Index & constraint checklist (all Position ledgers)

| Pattern | Apply to |
|---------|----------|
| `(user_id, financial_year, deleted_at)` | All claim + investment + income ledgers |
| Unique natural keys | Months, nights, rates, settings as specified |
| FK to `destinations` / `bank_accounts` | Nights, rates, folders, interest |
| Optional FK `evidence_version_id` → `evidence_versions` | Claims, income, investments, folder lines |
| Soft delete filter in RLS/default queries | All recoverable ledgers |
| Forward-only migrations + RLS same migration | Every new tenant table |

---

## 5. Evidence Relationships

### 5.1 Principles

1. Evidence Vault owns **proof**; Tax Position owns **figures**.
2. Links are optional on typed Position rows so V1 migration and mid-year entry work without binaries.
3. Preferred link target is `evidence_versions.id` (immutable), not a mutable file row alone.
4. Audit Mode traffic-lights completeness from Position claims + linked versions — missing evidence does not delete the claim.
5. AI may **suggest** links or draft amounts; human/import acceptance writes Position (U10).

### 5.2 Link patterns

| Pattern | Storage | When |
|---------|---------|------|
| Single version on a claim | `evidence_version_id` on claim row | One receipt → one claim |
| Many payslips → income month | `payslip_evidence_ids uuid[]` | Multiple payslips per month |
| Deduction workspace | `deduction_claim_evidence` | Requires version; m2m |
| Folder line | `receipt_folder_lines.evidence_version_id` | Meal line ↔ receipt |
| Inverse snapshot | `evidence_versions.linked_claim_ids` | Refresh on bind/unbind |

### 5.3 Examples

| Evidence | Supports | Link |
|----------|----------|------|
| Receipt (work expense) | `work_expense_claims` row | `evidence_version_id` on claim; Audit green when amount/date consistent |
| Payslip | `employment_income_months` | Append version id to `payslip_evidence_ids`; employer via `employers` / `payslips` |
| Roster | Travel period / trips | `trips` / `trip_legs.evidence_id`; nights remain on `destination_nights_months` — roster substantiates travel, does not silently overwrite nights |
| Flight receipt | `flight_claims` and/or `trip_legs` | Claim carries FX maths; leg carries itinerary context; both may point at same version |
| Dividend statement | `dividend_entries` | Optional `evidence_version_id` |
| CGT statement | `capital_gain_entries` | Optional `evidence_version_id` |
| Lease / rental docs | `rental_property_entries` | Optional version; multi-doc via future binding table if needed |

### 5.4 Completeness states (consumed by Audit Mode)

| State | Meaning |
|-------|---------|
| Green | Required evidence linked and consistent |
| Yellow | Partial / low confidence / mismatched amounts |
| Red | No evidence / missing critical docs |

Materialised in `audit_claim_statuses` ([10-audit-mode](./10-audit-mode.md)) — not stored as the source of truth for claim amounts.

---

## 6. Provenance

Every material Position value must be traceable (standards U11–U12).

### 6.1 Required provenance fields

| Field | Purpose |
|-------|---------|
| **Source** | Machine id: e.g. `ajx_calculator_tax_planner_v2`, `manual`, `ai_accepted`, `api` |
| **Provenance label** | Human string: e.g. `Imported from AJX Tax Version 1`, `Entered manually` |
| **Calculation version** | `engine_version` on summaries; formula keys inside `line_items` |
| **Origin kind** | `imported` \| `manual` \| `generated` (engine output) \| `ai_accepted` |
| **Created timestamp** | `created_at` |
| **Updated timestamp** | `updated_at` |
| **Imported timestamp** | `imported_at` when origin is import |
| **Import batch** | `import_batch_id` for undo / support |
| **Legacy id** | V1 entity id or deterministic synthetic key |
| **Actor** | `created_by` / `updated_by` / `actor_type` on mutations and summaries |
| **FX snapshot** | rate, month, `rate_from_ato`, `manual_aud` on monetary foreign rows |
| **Escape hatch** | `legacy_payload` jsonb for unsupported fields |

### 6.2 Origin kind rules

| Origin | Rules |
|--------|-------|
| `imported` | Preserve snapshotted AUD/FX; do not re-pull ATO on import; batch-scoped undo |
| `manual` | User (or accountant with write grant, future) explicit entry; draft auto-save separate from committed row |
| `generated` | Engine outputs only in summaries / line_items; never silently write over manual inputs |
| `ai_accepted` | Must store confidence + why from suggestion at acceptance time (U10); Position remains authority |

### 6.3 Summary-level provenance

`tax_year_summaries.line_items` must include, per figure: source row ids, FX metadata, formula key, `engine_version`, `computed_at`, actor. UI never displays an unexplained number.

---

## 7. Audit Requirements

### 7.1 ATO review

Retain for at least the Evidence Vault retention window (seven years) and align Position history:

| Retain | Why |
|--------|-----|
| All FY ledger rows (incl. soft-deleted until legal erasure) | Reconstruct working papers |
| Snapshotted FX and AUD on each foreign row | Reproducible conversions |
| `tax_year_summaries` for each relevant `engine_version` | Explain historical indicative figures |
| Evidence version links + vault binaries | Substantiation package |
| Import batch checksum + adapter versions | Migration trail |
| Audit packages (ZIP/PDF/index) when generated | Exportable pack |

Tax summaries included in Audit Mode are labelled **indicative / working paper**, not lodged returns.

### 7.2 Accountant review

| Retain / expose | Why |
|-----------------|-----|
| Read-only Position ledgers + latest summary for granted FYs | Same numbers the user sees |
| Claim completeness (traffic lights) | Know what still needs proof |
| Provenance labels (imported vs manual vs evidenced) | Trust and handoff quality |
| Append-only accountant audit events | Who viewed/exported what |
| Working-paper package artefacts | Handoff without mutating originals |

Accountants do not co-own evidence binaries; Position write (if ever granted) must be permissioned and audited separately from vault write.

### 7.3 User trust

| Requirement | Model support |
|-------------|----------------|
| Every figure traceable or explicitly incomplete | Provenance + missing-evidence states |
| No silent OCR overrides | AI drafts ≠ Position until accepted |
| Undo import / major mutations | `import_batch_id`, soft delete, real revert APIs (U8) |
| Multi-year intact | FY scoping; no destructive “replace all years” without confirmation (U3) |
| Dark/light + accessible surfaces | Out of schema — enforced in product standards |

---

## 8. Future Expansion

Design so the following ship without rewriting Tax Position ledgers.

### 8.1 Family accounts

- Introduce `organizations` (`type = family`) and `organization_memberships` ([12-organizations-future](./12-organizations-future.md)).
- Add nullable `organization_id` to all Position tenant tables; backfill one personal org per user.
- RLS: membership check supplements `user_id`.
- Each member’s personal FY Position remains separate unless product explicitly shares an entity org.

### 8.2 Multiple employers

- `employers` already exists; add `employer_id` on `employment_income_months` and `payslips`.
- Evolve uniqueness to `(user_id, financial_year, month_key, employer_id)` when per-employer months are required.
- Summaries aggregate across employers with line_items broken down by employer.

### 8.3 Businesses

- Org `type = business` with optional `abn`.
- Business-specific settings columns or jsonb on `tax_year_settings` / org metadata (entity rules attach to Position, not vault).
- Keep personal and business FY ledgers in separate org scopes.

### 8.4 Trusts

- Org `type = trust`; metadata for deed references.
- Multiple active FYs already supported by FY-scoped rows.
- Extend claim/income kinds only via migration + ADR — do not overload `other_investment_entries.kind` silently.

### 8.5 SMSF

- Org `type = smsf`; fund name in metadata.
- May require additional document types in Evidence (enum migration) and SMSF-specific Position ledgers later.
- Retention policies remain compatible with seven-year vault; Position history follows the same retention.

### 8.6 Expansion invariants

1. Never merge entity maths into a single personal vault blob.
2. Evidence remains shared infrastructure; Position remains FY + org scoped calculation authority.
3. Calculator parity engine versions remain explainable after multi-entity ships.
4. API / native clients consume typed Position contracts — not scraped reports (ADR-018).

---

## Document control

| Field | Value |
|-------|--------|
| Document | Tax Position Domain Model |
| Path | `docs/database/02-tax-position-domain-model.md` |
| Bounded context | Tax Position (ADR-021) |
| Companion schema narrative | `docs/architecture/16-v2-migration-architecture.md` §2 |
| Import mapping | `docs/migration/planner-adapter-contract.md` |
