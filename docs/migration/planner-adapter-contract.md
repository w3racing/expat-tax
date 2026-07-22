# AJX Tax V1 → V2 Planner Adapter Contract

**Status:** Canonical contract (pre-implementation)  
**Adapter id:** `ajx-calculator-tax-planner-v2`  
**Audience:** Product + engineering  
**Nature:** Contract only — no application code  

This document defines exactly how the live AJX Calculator **`TaxPlannerState`** JSON migrates into AJX Tax v2 **Tax Position** (and related reference tables). It is the primary migration path for real users. It does **not** replace the separate evidence-centric `ajx-tax-v1` export contract.

**Related:** [ADR-017](../architecture/adr/017-migration-wizard.md) · [ADR-021](../decisions/ADR-021-tax-position-domain.md) · [v2 migration architecture §3](../architecture/16-v2-migration-architecture.md) · [Migration schema](../database/11-migration.md) · [Evidence export contract](../api/11-migration-v1-export.md)

---

## 1. Source Format

### 1.1 Identity

| Property | Value |
|----------|--------|
| Canonical type | `TaxPlannerState` (`schemaVersion: 2`) |
| localStorage key | `ajx-tax-planner` |
| File export name | `AJX Tax Backup.json` |
| Content-Type | `application/json` / `.json` |
| Origin product | AJX Calculator (new menu structure) — Tax screen |

Detection must prefer shape over filename. A valid planner backup is accepted whether named `AJX Tax Backup.json` or pasted/uploaded under another name.

### 1.2 Top-level structure

```text
TaxPlannerState {
  schemaVersion: 2
  destinations: TaxDestination[]
  bankAccounts: BankAccount[]
  ratesByFy: Record<string /* fyEndYear */, DestinationRate[]>
  years: TaxYearRecord[]
  activeFyEndYear: number          // e.g. 2026 = FY 2025–26
  overseasAtoSalaryTable: "6" | "7" | "8"
}
```

Australian financial years are keyed by **FY end year** (year ending 30 June). Example: `fyEndYear: 2026` means FY **2025–26**.

### 1.3 Known entities

| Entity | Location | Purpose |
|--------|----------|---------|
| Destinations | `destinations[]` | Named places (e.g. Japan ports) with `id`, `name`, `sortOrder` |
| Bank accounts | `bankAccounts[]` | Reusable accounts for interest |
| Destination rates | `ratesByFy[fyEndYear][]` | Daily overseas allowance AUD per destination per FY |
| Tax year | `years[]` | One `TaxYearRecord` per FY |
| Monthly income | `years[].monthlyIncome[]` | USD employment (5th / 20th) + USD/AUD rate |
| Month away | `years[].monthAway[]` | Nights per destination per month |
| Receipt folders | `years[].receiptFolders[]` | Meals/incidentals folders + lines; lock drives substantiation |
| Work claims | `years[].otherClaims[]` | Work-related expenses (multi-currency) |
| Flights | `years[].flights[]` | Flight claims |
| Transport | `years[].transport[]` | Bus / train / taxi |
| Car km | `years[].carKm[]` | ATO cents-per-km method |
| Laundry | `years[].laundry[]` | JPY laundry claims |
| Apartment costs | `years[].apartmentCosts[]` | JPY rent/water/gas/electricity |
| Interest | `years[].interestByAccount[]` | Gross interest + TFN withheld (AUD) |
| Dividends | `years[].dividends[]` | Franked / unfranked / credits / TFN |
| Rental | `years[].rentalProperties[]` | Gross rent − expenses |
| Capital gains | `years[].capitalGains[]` | CGT schedule rows |
| Other investments | `years[].otherInvestments[]` | Managed fund / trust / foreign / other |
| Year notes | `years[].notes` | Free-text notes |
| Year scalars | `superannuationAud`, `overseasDailyOverrideAud`, `includeMedicareLevy` | FY settings |
| Global table preference | `overseasAtoSalaryTable` | TD overseas travel salary table id |

**Claim FX pattern (work / flight / transport / laundry / apartment):**  
`currencyCode` (where applicable), `localAmount`, `exchangeRate` (foreign units per A$1), `amountAud` / `audAmount`, optional `manualAud`, optional `rateFromAto`.

**Employment income pattern:**  
`incomeUsd5th`, `incomeUsd20th`, denormalised `incomeUsd`, `usdAudRate`, optional `usdAudFromAto`.  
**AUD = USD ÷ usdAudRate** when rate &gt; 0.

### 1.4 Example skeleton (illustrative)

```json
{
  "schemaVersion": 2,
  "destinations": [{ "id": "…", "name": "Tokyo", "sortOrder": 0 }],
  "bankAccounts": [{ "id": "…", "label": "Everyday", "institution": "CBA", "sortOrder": 0 }],
  "ratesByFy": {
    "2026": [{ "destinationId": "…", "dailyRateAud": 200 }]
  },
  "activeFyEndYear": 2026,
  "overseasAtoSalaryTable": "7",
  "years": [
    {
      "fyEndYear": 2026,
      "superannuationAud": 0,
      "overseasDailyOverrideAud": null,
      "includeMedicareLevy": true,
      "monthlyIncome": [],
      "monthAway": [],
      "receiptFolders": [],
      "otherClaims": [],
      "flights": [],
      "transport": [],
      "carKm": [],
      "laundry": [],
      "apartmentCosts": [],
      "interestByAccount": [],
      "dividends": [],
      "rentalProperties": [],
      "capitalGains": [],
      "otherInvestments": [],
      "notes": ""
    }
  ]
}
```

### 1.5 Known limitations

| Limitation | Implication for v2 |
|------------|-------------------|
| **No binaries** | No Evidence Vault files are created. Claims import with `evidence_version_id = null`. |
| **No employers / payslip documents** | Employment is month-level USD totals only; payslip evidence linking is post-migration. |
| **No trip / roster graph** | `monthAway` and receipt folders are the travel bridge — not full roster entities. |
| **Computed summaries not stored** | `TaxYearSummary` is calculated in V1, not exported. v2 must recompute `tax_year_summaries` after import with a pinned `engine_version`. |
| **ATO FX tables live outside the backup** | Rates are snapshotted onto rows (`exchangeRate`, `usdAudRate`, `rateFromAto`). Do not require live ATO fetch to import. |
| **Legacy field variants inside schema 2** | Older rows may lack split income (only `incomeUsd`), lack `dateYmd` on transport (only `monthKey`), or use deprecated receipt category fields (`breakfast`/`lunch`/…). Adapter must normalise like Calculator `normalizeState`. |
| **Not a full AJX app backup** | Full multi-module backups must be rejected (`full_backup`). Budget / Days Off / Notes backups are out of scope. |
| **IDs are client strings** | Usually UUIDs, not guaranteed unique across users or free in v2. Always map via `legacy_id_map`. |
| **Transport AUD field name differs** | V1 uses `audAmount`; other claims use `amountAud`. Target column is `amount_aud`. |
| **Laundry / apartment assume JPY** | No `currencyCode` on those V1 types — target defaults `currency_code = 'JPY'`. |

---

## 2. Target Format

### 2.1 Adapter write surface

The adapter produces a **Tax Position write plan** scoped to the authenticated user (later: `organization_id`). It does not write Evidence Vault binaries.

| Target family | Tables / objects |
|---------------|------------------|
| Profile / FY | `profiles` (preferred FY + migration flags), `financial_years` |
| Reference | `destinations`, `bank_accounts` |
| Year settings | `tax_year_settings` |
| Rates | `destination_rates` |
| Income | `employment_income_months` |
| Travel bridge | `destination_nights_months`, `receipt_folders`, `receipt_folder_lines` |
| Claims | `work_expense_claims`, `flight_claims`, `transport_claims`, `car_km_claims`, `laundry_claims`, `apartment_expense_claims` |
| Investments | `interest_entries`, `dividend_entries`, `rental_property_entries`, `capital_gain_entries`, `other_investment_entries` |
| Summaries | `tax_year_summaries` (recomputed post-commit) |
| Migration ledger | `import_batches`, `legacy_id_map` |
| FX reference (read) | `ato_exchange_rates` (optional verify; never overwrite historical row rates on import) |

### 2.2 Tax Position objects

Imported rows are first-class Tax Position entities (ADR-021):

- Authoritative FY calculation inputs, not report artefacts.
- May exist **without** evidence.
- Carry snapshotted FX and AUD amounts for audit (U11–U12).
- Belong to one `import_batch_id` for undo and provenance.

### 2.3 Evidence relationships

| Rule | Contract |
|------|----------|
| On import | Set `evidence_version_id = null` (and `payslip_evidence_ids = []` / equivalent empty) on all Position rows. |
| Provenance | Label every row as imported from AJX Tax Version 1 (see §6). |
| Post-migration | User (or later AI draft acceptance) attaches evidence versions; Audit Mode traffic-lights unsubstantiated claims. |
| Deduction workspace | Separate evidence-binding tables may remain empty until the user links documents — do not fabricate `deduction_claim_evidence` rows. |
| Source JSON retention | Store checksum + optional encrypted copy of the uploaded JSON on `import_batches` (or private Blob) for audit — **not** as a vault evidence item. |

---

## 3. Mapping Rules

### 3.1 Shared transforms

| Transform | Rule |
|-----------|------|
| FY label | `fyEndYear: N` → `financial_year: "{N-1}-{last two of N}"` e.g. `2026` → `2025-26` |
| Money | Store as `numeric(12,2)` (or documented precision); reject non-finite numbers |
| Booleans | Missing `rateFromAto` on FX rows: treat as **true** (Calculator default) unless `manualAud` implies otherwise |
| UUID PKs | Always mint new v2 UUIDs; preserve V1 id in `legacy_id` + `legacy_id_map` |
| Empty arrays | Missing arrays → `[]` |
| Unknown keys | Preserve on parent `legacy_payload` jsonb; do not fail import solely for unknown keys |
| Soft delete | Imported rows start `deleted_at = null` |

### 3.2 Detection & root validation

| Source | Target / rule | Validation | Default |
|--------|---------------|------------|---------|
| `schemaVersion` | Adapter accept | Prefer `== 2`. Accept known prior shapes only via documented normalisers that upgrade to v2 semantics. Reject unknown future majors until a new adapter version. | — |
| Shape | `ajx-calculator-tax-planner-v2` | Must look like planner: `schemaVersion` and/or `destinations` / `years` / `ratesByFy`. Must **not** match `ajx-tax-v1` (`exportVersion` + `app`) or full backup payload. | — |
| File size | `import_batches` | Enforce product size limit; fail closed with clear error. | — |
| Checksum | `import_batches.source_checksum` | SHA-256 of raw bytes. | Required on commit |

### 3.3 Root & reference entities

| Source field | Target field | Transformation | Validation | Default handling |
|--------------|--------------|----------------|------------|------------------|
| `destinations[].id` | `destinations.legacy_id` + map `entity_type=destination` | Keep string; new UUID PK | Non-empty id; unique within file | Generate id if missing (rare) |
| `destinations[].name` | `destinations.name` | Trim | Non-empty after trim → else flag row | `"Untitled destination"` only if forced soft-skip mode; else fail row |
| `destinations[].sortOrder` | `destinations.sort_order` | `Number` | Finite int | `0` |
| — | `destinations.default_currency` | Infer later from name heuristics optional | ISO if set | `null` |
| `bankAccounts[].id` | `bank_accounts.legacy_id` | As destinations | Required for interest FK resolution | Generate if missing |
| `bankAccounts[].label` | `bank_accounts.label` | Trim | — | `""` |
| `bankAccounts[].institution` | `bank_accounts.institution` | Trim | — | `null` if empty |
| `bankAccounts[].sortOrder` | `bank_accounts.sort_order` | Number | — | `0` |
| `activeFyEndYear` | `profiles.preferred_fy` + `financial_years.is_active` | Convert to FY label; mark matching FY active | Reasonable year range (e.g. 2000–2100) | First year in file / current FY if invalid |
| `overseasAtoSalaryTable` | Applied to each `tax_year_settings.overseas_ato_salary_table` (global V1 preference) | Parse `"6"|"7"|"8"` | Enum | Product default table (Calculator default) |
| `ratesByFy[K][].destinationId` | `destination_rates.destination_id` | Resolve via `legacy_id_map` | Must resolve to imported destination | Skip rate + report if orphan |
| `ratesByFy[K][].dailyRateAud` | `destination_rates.daily_rate_aud` | Number | ≥ 0 | `0` |
| `ratesByFy` key | `destination_rates.financial_year` + `fy_end_year` | Key string/int → FY label | Parsable year | Skip invalid keys + report |

### 3.4 Per financial year (`TaxYearRecord`)

| Source field | Target field | Transformation | Validation | Default handling |
|--------------|--------------|----------------|------------|------------------|
| `years[].fyEndYear` | `financial_years` + `tax_year_settings.fy_end_year` / `financial_year` | FY convert | Unique per user | Skip duplicate FY in same file (keep first, report) |
| `superannuationAud` | `tax_year_settings.superannuation_aud` | Number | ≥ 0 preferred (warn if &lt; 0) | `0` |
| `overseasDailyOverrideAud` | `tax_year_settings.overseas_daily_override_aud` | Number or null | — | `null` |
| `includeMedicareLevy` | `tax_year_settings.include_medicare_levy` | Boolean | — | `true` |
| `notes` | `tax_year_settings.notes` | String | Length cap | `""` |

### 3.5 Employment income (`monthlyIncome`)

| Source field | Target field | Transformation | Validation | Default handling |
|--------------|--------------|----------------|------------|------------------|
| `monthKey` | `employment_income_months.month_key` | `YYYY-MM` | Matches FY month set (Jul–Jun) | Skip invalid + report |
| `incomeUsd5th` | `income_usd_5th` | Number | ≥ 0 warn | `0` |
| `incomeUsd20th` | `income_usd_20th` | Number | ≥ 0 warn | `0` |
| `incomeUsd` | `income_usd_total` | Prefer 5th+20th; else legacy `incomeUsd` | — | Denormalise to 5th+20th on write |
| `usdAudRate` | `usd_aud_rate` | Number (USD per A$1) | &gt; 0 if USD &gt; 0 | `0`; AUD amount then `0` |
| `usdAudFromAto` | `usd_aud_from_ato` | Boolean | — | `true` if omitted and rate present |
| (computed) | `amount_aud` | `usd_total / usd_aud_rate` when rate &gt; 0 | Store snapshotted | Do **not** re-pull ATO on import |
| — | `payslip_evidence_ids` | Empty | — | `[]` |

Unique: `(user_id, financial_year, month_key)`.

### 3.6 Destination nights (`monthAway`)

| Source field | Target field | Transformation | Validation | Default handling |
|--------------|--------------|----------------|------------|------------------|
| `monthKey` | `destination_nights_months.month_key` | As above | FY month | Skip invalid |
| `destinations[].destinationId` | `destination_id` | Map legacy → new | Must resolve | Skip orphan |
| `destinations[].nights` | `nights` | Int | ≥ 0 | `0` |

### 3.7 Receipt folders

| Source field | Target field | Transformation | Validation | Default handling |
|--------------|--------------|----------------|------------|------------------|
| `receiptFolders[].id` | `receipt_folders.legacy_id` | Map | — | Generate if missing |
| `destinationId` | `destination_id` | Map | Resolve | Skip folder if orphan |
| `monthKey` | `month_key` | — | — | — |
| `dateYmd` | `date_ymd` | `YYYY-MM-DD` | Soft-validate format | `""` / derive from month if legacy |
| `currencyCode` | `currency_code` | Uppercase ISO | Known or flag | Infer from destination name if missing; else `JPY` common default with warning |
| `locked` | `locked` | Boolean | — | `false` |
| `lockedAtIso` | `locked_at` | Parse timestamptz | — | `null` |
| Legacy `breakfast`/`lunch`/`dinner`/`incidentals` | `receipt_folder_lines` | Expand via same rules as Calculator `migrateLegacyFolderFields` | Amounts ≥ 0 | Skip zero amounts |
| `receipts[].id` | line `legacy_id` | Map | — | Generate |
| `receipts[].dateYmd` | `date_ymd` | — | — | Folder `date_ymd` |
| `receipts[].amount` | `amount` | Number (local currency) | — | `0` |
| `receipts[].description` | `description` | — | — | `""` |
| — | line `evidence_version_id` | — | — | `null` |

### 3.8 Work / flight / transport claims

Shared claim columns unless noted: `date_ymd`, `description`/`item`, `currency_code`, `local_amount`, `exchange_rate`, `amount_aud`, `work_percentage`, `manual_aud`, `rate_from_ato`, `exchange_rate_month`, `legacy_id`, `import_batch_id`, `evidence_version_id=null`.

| Source | Target | Transformation | Validation | Default |
|--------|--------|----------------|------------|---------|
| `otherClaims[]` | `work_expense_claims` | Map fields; `item` ← `item` | `%` 0–100; km N/A | `%` → `100` if null |
| `flights[]` | `flight_claims` | `description` ← `description` | Same FX rules | — |
| `transport[]` | `transport_claims` | `audAmount` → `amount_aud`; `kind`; sync `month_key` from `dateYmd` if needed | `kind` ∈ bus/train/taxi | `kind` → `bus` if invalid; currency → `JPY` if missing |
| `dateYmd` | `date_ymd` + `exchange_rate_month` | Month = `YYYY-MM` from date | Prefer valid date | If only `monthKey`, set month; date may be first of month (legacy) |
| `exchangeRate` | `exchange_rate` | Snapshot as-is | &gt; 0 unless AUD/manual | `0` |
| `manualAud` | `manual_aud` | Boolean | If true, trust AUD | `false` unless implied |
| `rateFromAto` | `rate_from_ato` | Boolean | — | `true` if omitted |
| AUD amount | `amount_aud` | Prefer stored AUD; if not manual and local+rate present, may verify `local/rate` within tolerance — **do not rewrite** stored AUD on mismatch; flag in validation report | — | Stored value wins |

### 3.9 Car km / laundry / apartment

| Source | Target | Transformation | Validation | Default |
|--------|--------|----------------|------------|---------|
| `carKm[]` | `car_km_claims` | Map; snapshot `centsPerKm` | `kilometres` ≥ 0; warn if FY sum &gt; 5000 (cap is calculation-time) | `cents_per_km` from FY table if missing |
| `laundry[]` | `laundry_claims` | Force `currency_code=JPY` | FX snapshot | `manual_aud` inferred if AUD without local |
| `apartmentCosts[]` | `apartment_expense_claims` | `kind` ∈ rent/water/gas/electricity; `currency_code=JPY` | Enum | `kind` → `rent` if invalid |

### 3.10 Investments

| Source | Target | Transformation | Validation | Default |
|--------|--------|----------------|------------|---------|
| `interestByAccount[].accountId` | `interest_entries.bank_account_id` | Map legacy account | Must resolve | Skip + report |
| `grossInterestAud` / `tfnWithheldAud` | matching columns | Number | ≥ 0 warn | `0` |
| `dividends[]` | `dividend_entries` | Map franked/unfranked/credits/TFN | — | `0`s |
| `rentalProperties[]` | `rental_property_entries` | Map label, gross, expenses | — | — |
| `capitalGains[]` | `capital_gain_entries` | Map asset kind enum, dates, proceeds, cost, discount | Enum allow-list | `asset_kind` → `other` if unknown |
| `otherInvestments[]` | `other_investment_entries` | Map kind, gross, foreign tax | Enum | `kind` → `other` |

### 3.11 Post-commit calculation

| Source | Target | Transformation | Validation | Default |
|--------|--------|----------------|------------|---------|
| (none in JSON) | `tax_year_summaries` | Run Tax Position engine with pinned `engine_version` (V1 parity build) | Engine must be deterministic for fixtures | Required after successful commit |

---

## 4. Currency Migration

### 4.1 Convention (authoritative)

ATO / Calculator convention:

> **Exchange rate = units of foreign currency per A$1.**  
> **AUD = foreign_amount ÷ exchange_rate** (when rate &gt; 0).

Never invert this formula on import.

### 4.2 USD income

| Step | Rule |
|------|------|
| Inputs | `incomeUsd5th`, `incomeUsd20th` (fallback `incomeUsd`) |
| Rate | `usdAudRate` = USD per A$1 for that `monthKey` |
| AUD | `(5th + 20th) / usdAudRate` |
| Flag | Persist `usd_aud_from_ato` exactly as sourced |
| Import | **Do not** replace `usdAudRate` with a freshly fetched ATO rate |

### 4.3 AUD conversion (general claims)

| Case | Rule |
|------|------|
| `currencyCode === 'AUD'` | `amount_aud` = local/AUD entered; `exchange_rate` may be `1` or unused |
| `manualAud === true` | Trust `amountAud` / `audAmount`; keep local + rate for audit |
| Foreign + rate | Prefer stored AUD; rate month derived from claim date / `monthKey` |
| Missing rate + foreign amount | Import row; set AUD `0` or stored AUD if present; flag `fx_incomplete` in batch report |

### 4.4 JPY expenses

| Entity | Rule |
|--------|------|
| Laundry | Always JPY; `exchangeRate` is JPY per A$1 |
| Apartment costs | Always JPY; same |
| Transport / work / flights | Often JPY but may be USD/EUR/… — honour `currencyCode` |
| Default when laundry/apartment omit code | `currency_code = 'JPY'` |

### 4.5 ATO FX rates

| Concern | Contract |
|---------|----------|
| Source of truth at runtime (post-migration) | `ato_exchange_rates` (`currency_code`, year, month, `units_per_aud`, `source_version`) |
| Source of truth **for imported historical rows** | Snapshotted columns on the row (`exchange_rate`, `usd_aud_rate`, `rate_from_ato`, `exchange_rate_month`) |
| Optional verify | Compare snapshotted rate to `ato_exchange_rates` for same month; differences → warning only, never auto-correct |
| `rateFromAto === true` | Means “was tracking ATO in V1,” not “recompute now” |

### 4.6 Historical rates

| Rule | Rationale |
|------|-----------|
| Never silently recompute historical AUD on import | Preserves what the user saw in Calculator / Backup.json |
| Never mutate imported rates when monthly ATO cron updates | Historical audit stability (U12) |
| Recalculation after user edits in v2 | Allowed under current engine rules; must write new audit metadata |
| Bundled V1 FX JSON is not copied wholesale | Only rates present on rows (and optional future FX seed jobs) matter for migration |

---

## 5. Migration States

Wizard + `import_batches.status` (extended for this adapter):

| State | Meaning | Writes | User outcome |
|-------|---------|--------|--------------|
| **Preview** | Parse + normalise + dry-run counts/samples | `import_batches` may be created as `previewed` with checksum/counts; **no** Tax Position rows | Show entity counts, FY list, FX warnings, sample rows |
| **Validation** | Structural + business rules | Still no Position commits | Block commit on hard errors; soft warnings listed |
| **Import** | User confirmed duplicate decisions; status `importing` | Single DB transaction: maps + Position rows + provenance | Progress UI (U4) |
| **Success** | Commit completed; summaries recomputed | `status=completed`; `profiles.migration_completed_at`; wizard disabled (`migration_wizard_enabled=false`); `migration_last_batch_id` set | Summary + CTA: attach evidence / connect Drive |
| **Partial failure** | Not used for mid-transaction half-writes. If product later allows row-level soft-skip, batch is `completed` with `counts.skipped` / `error_report` — never leave orphan maps without rows | Prefer fail-closed: entire transaction rolls back → `failed` | Clear actionable error (U6); retry allowed |
| **Rollback** | Undo of a completed batch | Delete/soft-delete all rows with `import_batch_id = X` + related `legacy_id_map` entries; confirm + typing gate (U3); clear or adjust migration flags if no other successful batches | Only when no conflicting user edits, or with explicit “force” support path |

### 5.1 State machine

```text
upload → Preview → Validation → (resolve duplicates) → Import → Success
                     │                                    │
                     └──────── hard fail ─────────────────┴→ failed (retry)
Success → optional Rollback (same session / support) → wizard may re-open if admin enables
```

### 5.2 Transaction rules

1. Preview/validation never mutate Tax Position tables.  
2. Import is atomic per batch.  
3. On failure: `import_batches.status = failed`, `error_message` set, no partial `legacy_id_map` left from that attempt.  
4. Blob: migration creates **no** evidence binaries — nothing to roll back in object storage.  
5. Drive: do **not** auto-upload planner JSON into the Evidence Vault tree.

---

## 6. Provenance

Every imported Tax Position / reference record **must** retain:

| Field | Value / rule |
|-------|----------------|
| **Original source** | `provenance_source = ajx_calculator_tax_planner_v2` (stable machine id) |
| **Human label** | `provenance_label = "Imported from AJX Tax Version 1"` |
| **Import date** | `imported_at = timestamptz` of commit |
| **Original identifier** | `legacy_id` = V1 entity `id` (or synthetic stable key — see §7) |
| **Migration version** | `import_batches.adapter_id` + `adapter_contract_version` (this document’s version) + optional `engine_version` on summaries |
| **Batch link** | `import_batch_id` FK |
| **Payload escape hatch** | `legacy_payload` jsonb for unsupported / unknown fields |

### 6.1 Synthetic legacy ids

When V1 rows lack an `id` (e.g. some `interestByAccount` / rate rows), the adapter **must** invent a deterministic legacy key for idempotency, for example:

```text
interest:{fy}:{accountId}
destination_rate:{fyEndYear}:{destinationId}
employment:{fy}:{monthKey}
nights:{fy}:{monthKey}:{destinationId}
```

Determinism is mandatory so re-import detects duplicates.

### 6.2 Batch-level provenance

`import_batches` stores: `adapter_id`, `adapter_contract_version`, `source_filename`, `source_checksum`, `source_schema_version`, `counts`, `duplicate_report`, timestamps.

---

## 7. Duplicate Prevention

### 7.1 Exact (primary)

| Check | Rule |
|-------|------|
| Legacy map | Unique `(user_id, entity_type, legacy_id)` |
| Re-import same backup | Same checksum + same legacy ids → propose **Skip all exact** |
| Re-import after edit | Exact legacy hit → user chooses **Skip** / **Replace** / **Keep both** (Keep both only if new legacy key minted — default discourage) |

### 7.2 Fuzzy (secondary)

For claim-like rows without a legacy hit:

| Signal | Confidence |
|--------|------------|
| Same `financial_year` + `date_ymd` + `amount_aud` + normalised description/item | Medium |
| Same month + USD totals for employment | Medium |
| Same destination + month + nights | Medium |

Fuzzy matches never auto-skip without user decision in the wizard.

### 7.3 Checksum

`source_checksum` of the uploaded file is recorded. Identical checksum + completed batch for the same user → warn “This backup was already imported” and default decisions to Skip.

### 7.4 Cross-adapter

`ajx-tax-v1` evidence imports and planner imports share `legacy_id_map` but **different `entity_type` namespaces**. A planner claim id must not collide with an evidence item id semantically — always qualify `entity_type` (e.g. `work_expense_claim` vs `evidence_item`).

---

## 8. Future Compatibility

### 8.1 Adapter registry

| Adapter id | Role |
|------------|------|
| `ajx-calculator-tax-planner-v2` | This contract — live Calculator backups |
| `ajx-calculator-tax-planner-v3` (future) | New Calculator `schemaVersion` major |
| `ajx-tax-v1` | Evidence-centric export (separate contract) |
| Future CSV / other | New adapters; wizard chrome unchanged |

Wizard selects adapter by **detection**, not filename alone.

### 8.2 Versioning rules

1. **Additive V1 fields** (new optional keys under `schemaVersion: 2`) → store in `legacy_payload` or map when a minor contract bump documents them; do not fail validation.  
2. **Breaking Calculator schema** (`schemaVersion: 3+`) → new adapter id + contract doc; keep v2 adapter for existing backups.  
3. **`adapter_contract_version`** on batches (semver of this document) enables support to know which mapping rules applied.  
4. Normalisers may upgrade older intra-v2 shapes (split income, receipt categories, transport monthKey) **before** mapping — same as Calculator `normalizeState`.  
5. Optional future dual export (planner + evidence pack) is a **new** adapter or a composite that runs planner then evidence adapters in one batch group — out of scope for this contract’s write plan, but detection must not reject dual files when introduced; route sections explicitly.

### 8.3 Compatibility guarantees

| Guarantee | Detail |
|-----------|--------|
| Old backups keep working | `schemaVersion: 2` files remain importable indefinitely via this adapter |
| No silent maths drift | Historical FX/AUD preserved (§4) |
| Extensibility | Unknown keys preserved; new claim types require explicit mapping rows in a contract revision |
| Test obligation | Fixture tests from real `AJX Tax Backup.json` exports before shipping the adapter |

### 8.4 Document control

| Field | Value |
|-------|--------|
| Contract name | Planner Adapter Contract |
| Adapter id | `ajx-calculator-tax-planner-v2` |
| Contract version | `1.0.0` |
| Source schema | `TaxPlannerState` `schemaVersion: 2` |
| Target | AJX Tax v2 Tax Position + migration ledger |

---

## Appendix A — Entity type tokens (`legacy_id_map.entity_type`)

`destination` · `bank_account` · `financial_year` · `tax_year_settings` · `destination_rate` · `employment_income_month` · `destination_nights_month` · `receipt_folder` · `receipt_folder_line` · `work_expense_claim` · `flight_claim` · `transport_claim` · `car_km_claim` · `laundry_claim` · `apartment_expense_claim` · `interest_entry` · `dividend_entry` · `rental_property_entry` · `capital_gain_entry` · `other_investment_entry`

## Appendix B — Hard vs soft validation

| Hard fail (block import) | Soft warn (allow with report) |
|--------------------------|-------------------------------|
| Invalid JSON / wrong format / full backup | Orphan destination rate |
| Missing `years` and `destinations` entirely | Unknown currency code |
| Corrupt structure failing normaliser | FY car km &gt; 5000 |
| Checksum/file size policy violations | Snapshotted FX ≠ current ATO table |
| Unresolvable required FK when fail-closed mode | Empty notes / zero rows |

Default product posture: **fail closed** on schema errors; soft-skip only behind an explicit advanced option (aligned with evidence export contract).
