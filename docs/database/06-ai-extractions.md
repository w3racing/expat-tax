# AI extractions schema

## Enum updates

### `document_type` (replaces narrow `evidence_kind` for classification)

```sql
document_type:
  receipt
  payslip
  roster
  invoice
  bank_statement
  dividend_statement
  capital_gains_statement
  lease
  utility_bill
  travel_itinerary
  employment_contract
  other
```

`evidence_items.document_type` is the canonical classified type. Legacy `kind` may alias during migration.

### `extraction_field_key`

```sql
date_primary | date_period_start | date_period_end
merchant | employer
currency | amount_total | amount_subtotal | amount_net | amount_gross
gst | country | city
flight_number | hotel
tax_category_suggested
```

## `evidence_extractions` (expanded)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `evidence_id` | uuid FK | |
| `user_id` | uuid | |
| `model` | text | provider/model id |
| `schema_version` | int | e.g. `2` |
| `document_type` | document_type | |
| `document_type_confidence` | numeric(3,2) | |
| `overall_confidence` | numeric(3,2) | |
| `requires_confirmation` | boolean | derived at write time |
| `raw_response` | jsonb | provider payload (access-controlled) |
| `normalised` | jsonb | canonical extraction payload |
| `created_at` | timestamptz | |

### `normalised` shape (v2)

```json
{
  "documentType": "receipt",
  "fields": {
    "date_primary": { "value": "2026-03-12", "confidence": 0.94, "userCorrected": false },
    "merchant": { "value": "Qantas Club", "confidence": 0.91, "userCorrected": false },
    "currency": { "value": "AUD", "confidence": 0.99, "userCorrected": false },
    "amount_total": { "value": "42.50", "confidence": 0.93, "userCorrected": false },
    "gst": { "value": "3.86", "confidence": 0.72, "userCorrected": false }
  },
  "fx": {
    "applied": false
  },
  "taxCategory": {
    "suggested": "work_travel",
    "confidence": 0.81,
    "vaultFolderKey": "work_expenses_meals"
  },
  "duplicates": {
    "status": "none",
    "candidateEvidenceIds": []
  }
}
```

With FX:

```json
"fx": {
  "applied": true,
  "currencyOriginal": "USD",
  "amountOriginal": "120.00",
  "amountAud": "185.64",
  "exchangeRate": "1.5470",
  "rateMonth": "2026-03",
  "rateSource": "ato_monthly_average"
}
```

## `evidence_field_corrections`

User overrides per field (optional normalised table for querying).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `evidence_id` | uuid | |
| `user_id` | uuid | |
| `field_key` | text | |
| `value` | jsonb | |
| `corrected_at` | timestamptz | |

## `evidence_duplicate_links`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `evidence_id` | uuid | newer or uploaded copy |
| `duplicate_of_evidence_id` | uuid | canonical |
| `confidence` | numeric(3,2) | |
| `match_method` | text | `checksum` \| `perceptual_hash` \| `fuzzy` |
| `status` | text | `suggested` \| `confirmed` \| `dismissed` |
| `created_at` | timestamptz | |

Unique partial index: one `confirmed` link per `evidence_id`.

## `ato_exchange_rates`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `currency_code` | text | ISO 4217 |
| `rate_year` | int | |
| `rate_month` | int | 1–12 |
| `rate_to_aud` | numeric(18,8) | units of currency per 1 AUD or inverse — document convention in code |
| `source` | text | `ato_monthly_average` |
| `source_published_at` | date | |
| `ingested_at` | timestamptz | |

Unique: `(currency_code, rate_year, rate_month)`.

## `processing_jobs` extensions

| Column | Type | Notes |
|--------|------|-------|
| `job_type` | text | add `unpack_zip` \| `parse_csv` \| `ai_ingest` \| `fx_convert` \| `duplicate_scan` |
| `parent_job_id` | uuid | ZIP children |
| `input_artifact` | jsonb | e.g. zip member path |

## `evidence_items` columns (AI-related)

| Column | Type | Notes |
|--------|------|-------|
| `document_type` | document_type | |
| `overall_confidence` | numeric(3,2) | denormalised from latest extraction |
| `requires_confirmation` | boolean | |
| `suggested_tax_category` | deduction_category | nullable |
| `amount_aud` | numeric(12,2) | after FX |
| `exchange_rate_month` | text | `YYYY-MM` when FX applied |

## Indexes

```text
evidence_extractions (evidence_id, created_at desc)
evidence_duplicate_links (user_id, evidence_id)
evidence_duplicate_links (user_id, duplicate_of_evidence_id)
ato_exchange_rates (currency_code, rate_year, rate_month) unique
evidence_items (user_id, checksum_sha256) -- via evidence_files join for dedupe
```
