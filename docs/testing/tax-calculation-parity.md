# Tax Calculation Parity Specification

**Status:** Canonical — required before Tax Position engine changes ship  
**Audience:** Product + engineering  
**Nature:** Testing / release contract — no application code  

AJX Tax v2 must produce **identical Tax Position results** to the current AJX Calculator (`TaxPlannerState` / `summarizeTaxYear`) before new Tax Position features are added. This document defines philosophy, golden fixtures, comparison rules, regression strategy, and the release gate.

**Reference implementation:** AJX Calculator — new menu structure — `src/lib/taxPlanner.ts` (`summarizeTaxYear` and helpers)  
**Related:** [ADR-021 Tax Position domain](../decisions/ADR-021-tax-position-domain.md) · [Planner adapter contract](../migration/planner-adapter-contract.md) · [v2 migration architecture § Phase 2](../architecture/16-v2-migration-architecture.md)

---

## 1. Testing Philosophy

### 1.1 Reference implementation

The **existing AJX Calculator** is the reference implementation for Tax Position maths.

| Principle | Meaning |
|-----------|---------|
| Calculator wins | When v2 and Calculator disagree, **Calculator is correct** until an explicit, versioned rule change is accepted (new `engine_version` + ADR/spec update). |
| Behavioural parity first | Match `summarizeTaxYear` outputs and intermediate claim AUD amounts — not merely “close enough for a demo.” |
| Determinism | Fixtures pin FX rates (`rateFromAto: false` / snapshotted rates) so ATO table refreshes cannot change golden expectations. |
| Traceability | Every material figure remains explainable (U11–U12): income lines, claim lines, FX, brackets, offsets. |
| No silent “improvements” | Rounding changes, bracket updates, Medicare rules, or car-km caps that alter results require a **new engine version** and regenerated goldens — never a quiet drift. |

### 1.2 What “parity” covers

| In scope | Out of scope (initially) |
|----------|---------------------------|
| FY income aggregation | Evidence Vault / OCR |
| Claim AUD conversion (snapshotted rates) | UI chrome / print layout |
| Overseas daily (nights × rates, override) | Accountant Mode permissions |
| Car km FIFO 5,000 km cap + cents/km | Drive sync |
| Taxable income, Stage 3 (and FY-keyed) brackets | Lodgement / advice |
| Franking / TFN / foreign tax offsets | AI suggestions |
| Medicare levy (2%), estimated tax, PAYG/24 | |

### 1.3 Engine version pin

v2 persists summaries with `engine_version` (e.g. `calculator-parity-2026.1`). Parity suites assert against the pinned reference. A deliberate tax-law or formula change:

1. Lands behind a new `engine_version`
2. Regenerates affected goldens
3. Documents the delta in this spec (or a linked changelog)
4. Passes the release gate (§6)

---

## 2. Golden Fixtures

All fixtures use **FY end year `2026`** (Australian FY **2025–26**) unless noted. Stage 3 resident brackets apply.

**Fixture hygiene (mandatory):**

- Stable string ids (not random UUIDs at assert time)
- `rateFromAto: false` on all FX rows; rates embedded on the row
- `manualAud: false` unless the scenario is specifically testing manual AUD
- `includeMedicareLevy: true` unless testing levy-off
- No dependence on live `ato_exchange_rates` or Calculator bundled FX cache at assert time

Fixture artefacts live under (when implemented):

```text
tests/fixtures/tax-parity/
  <fixture-id>/
    input.taxplanner.json      # TaxPlannerState subset
    expected.summary.json      # TaxYearSummary
    expected.lines.json        # optional intermediate claim AUD lines
    README.md                  # human scenario notes
```

### 2.1 Scenario catalogue

| ID | Scenario | Exercises |
|----|----------|-----------|
| `parity-simple-employee` | Simple employee | USD→AUD employment, empty claims, brackets + Medicare |
| `parity-airline-international` | International airline employee | Nights×rates, flights, transport, laundry, apartment, car km, super |
| `parity-foreign-income` | Foreign income | Multi-month USD income + foreign investment + foreign tax offset |
| `parity-foreign-expenses` | Foreign expenses | JPY/USD work claims + laundry; low AU interest; below tax-free threshold |
| `parity-travel-deductions` | Travel deductions | Overseas daily calculation **and** override |
| `parity-investment-income` | Investment income | Interest, dividends (franking), rental, CGT discount, other investments |
| `parity-mixed-currencies` | Mixed currencies | AUD/JPY/USD/EUR claims + car km over annual cap |

---

## 3. Expected Results

For each fixture: **Inputs** → **Expected calculations** (formula chain) → **Expected outputs** (`TaxYearSummary` field values from the reference implementation).

Money and rates below are full IEEE floats as produced by Calculator-style division (no intermediate banker’s rounding). Comparison uses §4 tolerances when asserting.

Shared constants (reference):

| Constant | Value |
|----------|--------|
| `MEDICARE_LEVY_RATE` | `0.02` |
| `PAY_PERIODS_PER_YEAR` | `24` |
| `CAR_KM_ANNUAL_MAX` | `5000` |
| Cents/km FY2026 | `88` |
| FX convention | Foreign units per A$1; **AUD = foreign ÷ rate** |

Stage 3 bracket tax on taxable income \(T\):

| From | To | Rate |
|------|-----|------|
| 0 | 18,200 | 0% |
| 18,200 | 45,000 | 16% |
| 45,000 | 135,000 | 30% |
| 135,000 | 190,000 | 37% |
| 190,000 | ∞ | 45% |

---

### 3.1 `parity-simple-employee`

#### Inputs

- Destinations: none required  
- One year `fyEndYear: 2026`, `includeMedicareLevy: true`, all claim arrays empty, `superannuationAud: 0`  
- `monthlyIncome`: **12** months (`2025-07` … `2026-06`), each:
  - `incomeUsd5th: 5000`, `incomeUsd20th: 5000`, `incomeUsd: 10000`
  - `usdAudRate: 0.65`, `usdAudFromAto: false`

#### Expected calculations

| Step | Formula | Value |
|------|---------|-------|
| Monthly USD | 5000 + 5000 | 10,000 |
| Monthly AUD | 10000 ÷ 0.65 | 15,384.615384615385… |
| Employment | × 12 | 184,615.38461538462… |
| Total income | = employment | same |
| Total claims | 0 | 0 |
| Taxable | income − claims | 184,615.38461538462… |
| Gross income tax | Stage 3 on taxable | 49,645.69230769231… |
| Medicare | taxable × 0.02 | 3,692.307692307692… |
| Estimated tax | income tax + Medicare | 53,338 |
| PAYG / pay | estimated ÷ 24 | 2,222.416666666667… |

#### Expected outputs (`TaxYearSummary`)

| Field | Expected |
|-------|----------|
| `fyEndYear` | `2026` |
| `fyLabel` | `FY 2025–26` |
| `employmentIncomeAud` | `184615.38461538462` |
| `interestIncomeAud` … `otherInvestmentAud` | `0` |
| `totalIncomeAud` | `184615.38461538462` |
| `superannuationAud` … `apartmentCostsAud` | `0` |
| `totalClaimsAud` | `0` |
| `taxableIncomeAud` | `184615.38461538462` |
| `taxOffsetsAud` | `0` |
| `grossIncomeTaxAud` / `incomeTaxAud` | `49645.69230769231` |
| `medicareLevyAud` | `3692.307692307692` |
| `estimatedTaxAud` | `53338` |
| `effectiveRate` | `estimatedTaxAud / taxableIncomeAud` |
| `paygPerPay` | `2222.416666666667` |

---

### 3.2 `parity-airline-international`

#### Inputs

- Destinations: `dest-japan`, `dest-thailand`  
- `ratesByFy["2026"]`: Japan `185`, Thailand `140` AUD/night  
- Employment: **10** months at same USD split/rate as simple (`0.65`)  
- `superannuationAud: 3000`  
- `monthAway`: Japan **40** nights, Thailand **10** nights (any month split)  
- `otherClaims`: one AUD row `amountAud: 220`, `workPercentage: 80`, `currencyCode: "AUD"`  
- `flights`: `localAmount: 800`, `currencyCode: "USD"`, `exchangeRate: 0.66`, `workPercentage: 100`  
- `transport`: `localAmount: 5000`, `currencyCode: "JPY"`, `exchangeRate: 97.5`, `workPercentage: 100`  
- `carKm`: `1200` km, `centsPerKm: 88`  
- `laundry`: `localAmount: 15000`, `exchangeRate: 97.5`  
- `apartmentCosts`: `kind: "rent"`, `localAmount: 180000`, `exchangeRate: 97`

#### Expected calculations

| Component | Formula | AUD |
|-----------|---------|-----|
| Employment | 10 × (10000 ÷ 0.65) | 153,846.15384615384… |
| Overseas daily | 40×185 + 10×140 | 8,800 |
| Other claims | 220 × 80% | 176 |
| Flights | 800 ÷ 0.66 | 1,212.121212121212… |
| Transport | 5000 ÷ 97.5 | 51.282051282051… |
| Car km | 1200 × 0.88 | 1,056 |
| Laundry | 15000 ÷ 97.5 | 153.846153846154… |
| Apartment | 180000 ÷ 97 | 1,855.670103092784… |
| Total claims | sum + super 3000 | 16,304.919520… |
| Taxable | 153,846.15… − 16,304.92… | 137,541.234326… |

#### Expected outputs (key fields)

| Field | Expected |
|-------|----------|
| `employmentIncomeAud` | `153846.15384615384` |
| `overseasDailyAud` / `overseasDailyCalculatedAud` | `8800` |
| `otherClaimsAud` | `176` |
| `flightsAud` | `1212.121212121212` |
| `transportAud` | `51.28205128205128` |
| `carKmAud` | `1056` |
| `carKmEntered` / `carKmClaimable` | `1200` |
| `laundryAud` | `153.84615384615385` |
| `apartmentCostsAud` | `1855.6701030927836` |
| `totalClaimsAud` | `16304.919520346345` |
| `taxableIncomeAud` | `137541.2343258075` |
| `grossIncomeTaxAud` / `incomeTaxAud` | `32228.25670174225` |
| `medicareLevyAud` | `2750.82468651615` |
| `estimatedTaxAud` | `34979.0813882584` |
| `paygPerPay` | `1457.4617245107667` |

---

### 3.3 `parity-foreign-income`

#### Inputs

- Employment: **6** months, `incomeUsd5th/20th: 8000` each, `usdAudRate: 0.64`  
- `otherInvestments`: one row `grossAud: 2500`, `foreignTaxPaidAud: 400`, `kind: "foreign"`  
- No other income/claims

#### Expected calculations

| Step | Value |
|------|-------|
| Monthly AUD | 16000 ÷ 0.64 = 25,000 |
| Employment | 6 × 25,000 = **150,000** |
| Other investment | **2,500** |
| Total income / taxable | **152,500** |
| Gross tax (Stage 3) | **37,763** |
| Foreign tax offset | **400** |
| Income tax | 37,763 − 400 = **37,363** |
| Medicare | 152,500 × 0.02 = **3,050** |
| Estimated | **40,413** |
| PAYG | 40413 ÷ 24 = **1,683.875** |

#### Expected outputs (key fields)

| Field | Expected |
|-------|----------|
| `employmentIncomeAud` | `150000` |
| `otherInvestmentAud` | `2500` |
| `totalIncomeAud` / `taxableIncomeAud` | `152500` |
| `foreignTaxOffsetAud` / `taxOffsetsAud` | `400` |
| `grossIncomeTaxAud` | `37763` |
| `incomeTaxAud` | `37363` |
| `medicareLevyAud` | `3050` |
| `estimatedTaxAud` | `40413` |
| `paygPerPay` | `1683.875` |

---

### 3.4 `parity-foreign-expenses`

#### Inputs

- `interestByAccount`: `grossInterestAud: 1200`, `tfnWithheldAud: 50`  
- `otherClaims`:
  - JPY `25000` @ rate `98`, 100% work
  - USD `150` @ rate `0.67`, **50%** work
- `laundry`: three rows of `10000` JPY @ `98`  
- No employment

#### Expected calculations

| Component | Formula | AUD |
|-----------|---------|-----|
| Interest income | — | 1,200 |
| Work JPY | 25000 ÷ 98 | 255.102040816327… |
| Work USD | (150 ÷ 0.67) × 50% | 111.940298507463… |
| Other claims | sum | 367.04233932379… |
| Laundry | 3 × (10000 ÷ 98) | 306.122448979592… |
| Total claims | | 673.164788303381… |
| Taxable | 1200 − claims | 526.835211696619… |
| Gross tax | taxable &lt; 18,200 | **0** |
| Income tax | max(0, 0 − 50) | **0** |
| Medicare | taxable × 0.02 | 10.536704233932… |
| Estimated | | 10.536704233932… |

#### Expected outputs (key fields)

| Field | Expected |
|-------|----------|
| `interestIncomeAud` | `1200` |
| `otherClaimsAud` | `367.0423393237892` |
| `laundryAud` | `306.1224489795919` |
| `totalClaimsAud` | `673.1647883033811` |
| `taxableIncomeAud` | `526.8352116966189` |
| `tfnWithheldAud` / `taxOffsetsAud` | `50` |
| `grossIncomeTaxAud` / `incomeTaxAud` | `0` |
| `medicareLevyAud` / `estimatedTaxAud` | `10.536704233932378` |
| `effectiveRate` | `0.02` |
| `paygPerPay` | `0.43902934308051575` |

---

### 3.5 `parity-travel-deductions`

#### Inputs

- Destination `dest-x`, rate `200` AUD/night  
- `monthAway`: **25** nights  
- `overseasDailyOverrideAud: 4800` (calculated would be 5,000)  
- Employment: 12 months, `3000+3000` USD @ `usdAudRate: 0.70`

#### Expected calculations

| Step | Value |
|------|-------|
| Employment | 12 × (6000 ÷ 0.70) = **102,857.142857…** |
| `overseasDailyCalculatedAud` | 25 × 200 = **5,000** |
| `overseasDailyAud` | override **4,800** |
| Taxable | 102,857.14… − 4,800 = **98,057.142857…** |
| Gross / income tax | **20,205.142857…** |
| Medicare | **1,961.142857…** |
| Estimated | **22,166.285714…** |

#### Expected outputs (key fields)

| Field | Expected |
|-------|----------|
| `employmentIncomeAud` | `102857.14285714286` |
| `overseasDailyCalculatedAud` | `5000` |
| `overseasDailyAud` | `4800` |
| `totalClaimsAud` | `4800` |
| `taxableIncomeAud` | `98057.14285714286` |
| `grossIncomeTaxAud` / `incomeTaxAud` | `20205.142857142855` |
| `medicareLevyAud` | `1961.142857142857` |
| `estimatedTaxAud` | `22166.28571428571` |
| `paygPerPay` | `923.595238095238` |

**Assert both** calculated and override fields — override must not rewrite `overseasDailyCalculatedAud`.

---

### 3.6 `parity-investment-income`

#### Inputs

- Interest: gross `800`, TFN `100`  
- Dividend: franked `700`, unfranked `200`, franking credits `300`, TFN `20`  
  - Assessable = 700 + 200 + 300 = **1,200**  
- Rental: gross `24000`, expenses `9000` → net **15,000**  
- CGT: proceeds `50000`, cost `30000`, `discountEligible: true` → taxable gain **10,000**  
- Other investment: gross `1500`, foreign tax `100`

#### Expected calculations

| Step | Value |
|------|-------|
| Total income | 800 + 1200 + 15000 + 10000 + 1500 = **28,500** |
| Taxable | **28,500** (no claims) |
| Gross tax | **1,648** |
| Offsets | franking 300 + TFN 120 + foreign 100 = **520** |
| Income tax | 1648 − 520 = **1,128** |
| Medicare | 28500 × 0.02 = **570** |
| Estimated | **1,698** |
| PAYG | **70.75** |

#### Expected outputs (key fields)

| Field | Expected |
|-------|----------|
| `interestIncomeAud` | `800` |
| `dividendIncomeAud` | `1200` |
| `rentalIncomeAud` | `15000` |
| `capitalGainsAud` | `10000` |
| `otherInvestmentAud` | `1500` |
| `totalIncomeAud` / `taxableIncomeAud` | `28500` |
| `frankingCreditsAud` | `300` |
| `tfnWithheldAud` | `120` |
| `foreignTaxOffsetAud` | `100` |
| `taxOffsetsAud` | `520` |
| `grossIncomeTaxAud` | `1648` |
| `incomeTaxAud` | `1128` |
| `medicareLevyAud` | `570` |
| `estimatedTaxAud` | `1698` |
| `paygPerPay` | `70.75` |

---

### 3.7 `parity-mixed-currencies`

#### Inputs

- Employment: 12 months, `4500+4500` USD @ `0.66`  
- `superannuationAud: 5000`  
- Overseas: 15 nights × `190` = 2,850  
- `otherClaims` (all 100% work unless noted):
  - AUD `100`
  - JPY `12000` @ `96.5`
  - USD `80` @ `0.66`
  - EUR `50` @ `0.61`
- Flight: USD `450` @ `0.66`  
- Transport: JPY `3000` @ `96.5`  
- Laundry: JPY `8000` @ `96.5`  
- Apartment: JPY `95000` @ `96.5`  
- Car km: two claims `3000` + `2500` km @ `88` c/km (FIFO cap → **5,000** claimable)

#### Expected calculations

| Component | AUD |
|-----------|-----|
| Employment | 12 × (9000 ÷ 0.66) = 163,636.363636… |
| Other claims | 100 + 12000/96.5 + 80/0.66 + 50/0.61 ≈ 427.531666… |
| Flights | 450 ÷ 0.66 ≈ 681.818182… |
| Transport | 3000 ÷ 96.5 ≈ 31.088083… |
| Car km | 5000 × 0.88 = **4,400** (`entered` 5500, `claimable` 5000) |
| Laundry | 8000 ÷ 96.5 ≈ 82.901554… |
| Apartment | 95000 ÷ 96.5 ≈ 984.455959… |
| Total claims | ≈ 14,457.795444… |
| Taxable | ≈ 149,178.568193… |

#### Expected outputs (key fields)

| Field | Expected |
|-------|----------|
| `employmentIncomeAud` | `163636.36363636365` |
| `overseasDailyAud` | `2850` |
| `otherClaimsAud` | `427.5316659330929` |
| `flightsAud` | `681.8181818181819` |
| `transportAud` | `31.088082901554404` |
| `carKmAud` | `4400` |
| `carKmEntered` | `5500` |
| `carKmClaimable` | `5000` |
| `laundryAud` | `82.90155440414508` |
| `apartmentCostsAud` | `984.4559585492228` |
| `totalClaimsAud` | `14457.795443606196` |
| `taxableIncomeAud` | `149178.56819275744` |
| `grossIncomeTaxAud` / `incomeTaxAud` | `36534.07023132725` |
| `medicareLevyAud` | `2983.571363855149` |
| `estimatedTaxAud` | `39517.6415951824` |
| `paygPerPay` | `1646.5683997992666` |

---

### 3.8 Intermediate line expectations

For claim-heavy fixtures (`airline`, `foreign-expenses`, `mixed`), golden packs **should** also include per-row expected AUD (post work%), so failures name the drifting line — not only the summary total.

---

## 4. Comparison Rules

### 4.1 Field classes

| Class | Fields | Acceptable difference |
|-------|--------|------------------------|
| **Exact** | `fyEndYear`, labels, booleans, enums, integer km counts (`carKmEntered`, `carKmClaimable`), offsets that are whole dollars in fixtures | Bit-identical after normal JSON number parse |
| **Money** | All `*Aud` summary amounts, per-line AUD | Absolute difference ≤ **`0.005`** AUD (half-cent). Prefer documenting as “round to 2 dp for display; assert raw ≤ 0.005 vs reference.” |
| **Rate** | `effectiveRate` | Absolute difference ≤ **`1e-9`** (relative to full-precision division) |
| **Derived pay** | `paygPerPay` | Same as money (≤ `0.005`) **or** recompute from `estimatedTaxAud / 24` within money tolerance |
| **Bracket rows** | `bracketRows[]` | Same bracket boundaries/rates; per-bracket tax within money tolerance |

### 4.2 Explicitly unacceptable

| Drift | Treatment |
|-------|-----------|
| Any money field &gt; `0.005` AUD vs reference | **Fail** |
| Using live ATO rates when fixture pinned snapshots | **Fail** (non-deterministic) |
| Reordering that changes car-km FIFO allocation | **Fail** |
| Override overseas daily affecting `overseasDailyCalculatedAud` | **Fail** |
| Silent 2 dp rounding inside the engine before compare | **Fail** unless a versioned rounding ADR changes the reference |
| Skipping Medicare when `includeMedicareLevy: true` | **Fail** |

### 4.3 Display vs engine

UI may format with `formatAud` (0–2 fraction digits). **Parity asserts against engine floats / stored `tax_year_summaries`, not against formatted strings.**

### 4.4 Floating-point note

Reference Calculator uses IEEE division without intermediate monetary rounding. v2 must match that behaviour for `engine_version` parity builds. If a future engine adopts banker’s rounding to 2 dp per line, goldens regenerate under a **new** `engine_version`.

---

## 5. Regression Strategy

### 5.1 Layers

| Layer | When | What |
|-------|------|------|
| **L0 — Unit** | Every PR touching FX helpers, brackets, claim AUD, car km, summarize | Pure functions vs golden intermediates |
| **L1 — Fixture suite** | Every PR touching Tax Position domain / migration import recompute | All §2 fixtures: input → summary (+ lines) |
| **L2 — Import parity** | PRs touching planner adapter | Import `input.taxplanner.json` → recompute → same goldens |
| **L3 — Cross-check** | Nightly / pre-release | Optional: run Calculator `summarizeTaxYear` on same JSON (shared fixture) and diff v2 |
| **L4 — Real backup smoke** | Pre-release | Anonymised real `AJX Tax Backup.json` samples: import + summary smoke (no golden lock unless promoted) |

### 5.2 On every Tax Position change

1. Run L0 + L1 locally and in CI.  
2. If formula intent changes: bump `engine_version`, update this spec, regenerate goldens, note changelog.  
3. If only refactor: goldens must stay green with **zero** intentional expected-file edits.  
4. Migration adapter changes must still pass L2 (imported rows recompute to the same summary).

### 5.3 CI gate

- Job name (suggested): `tax-calculation-parity`  
- Required check on `main` and on PRs that touch:
  - Tax Position services / schema
  - `ato_exchange_rates` consumption in claim maths
  - Planner migration adapter
  - Shared formula packages

### 5.4 Promoting new fixtures

New scenarios (e.g. levy off, pre-Stage 3 FY, car km exactly at cap edge) are added by:

1. Authoring `input.taxplanner.json`  
2. Generating `expected.summary.json` from the **Calculator reference** (or pinned parity module extracted from it)  
3. Recording the scenario in §2–§3  
4. Landing in the same PR as the first failing-then-green test

---

## 6. Release Requirement

### 6.1 Gate (non-negotiable)

**No Tax Position changes are released without parity verification.**

| Release type | Requirement |
|--------------|-------------|
| Production deploy affecting Tax Position read/write/summary | L1 green on the release commit; L2 if migration code changed |
| Hotfix to claim/FX/tax maths | L0 + L1 green; explicit note of `engine_version` |
| “Docs only” / Evidence-only releases | Parity job not required **unless** shared formula modules changed |
| New Tax Position feature (UI or API) | Parity green **before** feature flag default-on |

### 6.2 Definition of done (Tax Position PR)

- [ ] Parity suite (`§2` fixtures) passes within §4 tolerances  
- [ ] `engine_version` unchanged **or** bumped with regenerated goldens + spec note  
- [ ] No reliance on live ATO fetch inside fixture tests  
- [ ] Summary figures remain audit-traceable (line items / source ids)  
- [ ] Reviewer confirms Calculator-reference behaviour for any intentional delta  

### 6.3 Failure protocol

If production drift is detected against Calculator on a real backup:

1. Treat as **P0 trust defect**  
2. Pin/revert `engine_version` if needed  
3. Add a new golden reproducing the backup slice  
4. Do not ship further Tax Position features until L1 is green  

### 6.4 Authority

Product may accept a **documented** divergence (e.g. updated ATO law) only by shipping a new `engine_version` and updating this specification. Undocumented divergence is a release blocker.

---

## Appendix A — Reference formula chain

Matches Calculator `summarizeTaxYear`:

```text
totalIncome = employment + interest + dividendAssessable + netRental + netCgt + otherInvestments
overseasDaily = override ?? Σ (nights × dailyRateAud)
totalClaims = super + overseasDaily + other + flights + transport + carKm + laundry + apartment
taxableIncome = totalIncome − totalClaims
taxOffsets = frankingCredits + tfnWithheld + foreignTaxPaid
grossIncomeTax = bracketTax(max(0, taxableIncome), fyEndYear)
incomeTax = max(0, grossIncomeTax − taxOffsets)
medicareLevy = includeMedicareLevy ? max(0, taxableIncome) × 0.02 : 0
estimatedTax = incomeTax + medicareLevy
effectiveRate = taxableIncome > 0 ? estimatedTax / taxableIncome : 0
paygPerPay = estimatedTax / 24
```

Claim AUD (non-manual, foreign): `claimAmount(localAmount / exchangeRate, workPercentage)`  
Employment AUD: `monthlyIncomeUsdTotal / usdAudRate`  
CGT discount: `max(0, proceeds − cost) × 0.5` when `discountEligible` (losses not discounted).

## Appendix B — Document control

| Field | Value |
|-------|--------|
| Spec name | Tax Calculation Parity Specification |
| Spec version | `1.0.0` |
| Reference FY for goldens | End year `2026` (FY 2025–26) |
| Reference engine | AJX Calculator `summarizeTaxYear` (parity pin) |
