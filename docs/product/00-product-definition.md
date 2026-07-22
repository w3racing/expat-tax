# AJX Tax — Product Definition

**Status:** Canonical product definition  
**Audience:** Product, design, leadership, partners  
**Nature:** Product definition — not a technical specification  
**MVP foundation:** [ADR-024 Overnight workflow](../architecture/adr/024-overnight-workflow-mvp-foundation.md)

**Tagline:** Overnight claims, built the way that already works — simple, reliable, fast, audit-ready.

**Philosophy:**

> Simple. Reliable. Fast. Audit-ready.

**Commercial bar:** AJX Tax is a commercial SaaS product. Every screen should be something you would be **proud to show another professional pilot**. Before any feature: does it make annual tax prep simpler, reduce effort, improve trust, and improve audit readiness? If not — reconsider. Do not add complexity unless it clearly improves the product. See [Commercial product bar](../standards/05-commercial-product-bar.md).

**MVP spine:** The proven AJX Calculator overnight workflow — not a generic expense tracker, not an AI-first vault, not a roster-interpretation product.

---

## 1. What AJX Tax is

AJX Tax is an Australian tax preparation product whose **MVP foundation** is the overnight claim workflow that AJX Calculator users have already proven across multiple financial years:

1. Create or select a financial year.  
2. Enter overnight counts manually by destination and month.  
3. Upload supporting evidence (rosters, payslips, receipts, PDFs, screenshots).  
4. Open a destination.  
5. Create sample days for that destination.  
6. Enter receipts for each sample day.  
7. Complete the sample day.  
8. Automatically calculate the average daily spend.  
9. Apply that average to every qualifying overnight.  
10. Display the resulting claim in the Tax Position.

Two domains support that spine:

| Half | What it is |
|------|------------|
| **Overnight + sample days** | The calculation path: overnight table is the source of truth for counts; completed sample days produce average daily spend; that average applies to qualifying overnights. |
| **Evidence Vault** | The durable home for rosters, payslips, receipts, and supporting documents — proof for the claim, not a silent second calculator. |
| **Tax Position** | The living FY view that displays the overnight-derived claim (and other year inputs as the product expands) with full provenance. |

**Roster is evidence.** The **overnight table is the source of truth.**

AJX Tax organises proof and maintains a traceable tax position. It does **not** lodge returns, replace a registered tax agent, or give personalised tax advice.

---

## 2. Who it is for

AJX Tax is for people whose Australian tax affairs involve **overnights, destinations, and proof** — especially those who already think in terms of nights away and sample-day substantiation.

| Who | Why it fits |
|-----|-------------|
| **Airline pilots** | Destination overnights, meal/incidental patterns, roster as supporting evidence |
| **Cabin crew** | High overnight volume, destination averages, receipt substantiation |
| **FIFO and remote workers** | Away nights, camp/remote patterns, roster evidence |
| **International consultants** | Multi-destination overnights, FX on receipts, clear claim maths |
| **Frequent business travellers** | Overnight counts + sample days without bookkeeping theatre |

Secondary audiences later: accountants reviewing an audit-ready pack; households and entities on the same overnight-and-evidence spine.

Primary user today: someone who wants the Calculator overnight workflow in a calm, modern product — without becoming their own bookkeeper or depending on AI.

---

## 3. The problems it solves

### June scramble without a trusted method

People have nights away and receipts, but no durable place that turns sample days into an average and applies it to overnights with a clear audit trail.

### Tools that replace a working method

Generic expense trackers and AI-first tax apps force a new mental model. AJX Tax keeps the method that already works.

### Numbers without proof

Totals without overnight counts, sample days, and linked receipts fail when an accountant or the ATO asks.

### Roster-as-requirement fatigue

Rosters matter as evidence. Forcing roster parsing before a claim can be built adds fragility. Manual overnight entry is intentional and reliable.

### Fear of getting it wrong

Clear steps, visible averages, and provenance replace gut feel — without inventing precision.

---

## 4. Why it is different

| Typical tax / accounting product | AJX Tax MVP |
|----------------------------------|-------------|
| Generic expense categories as the front door | Overnight → sample day → average → claim |
| Roster OCR or AI required to start | Manual overnight entry; AI optional later |
| Totals without a proof path | Audit-ready: counts, sample days, receipts, evidence |
| Spreadsheet density | Calm, fast, step-clear UX |
| Black-box estimates | Every material figure traceable |

**Differentiation in one line:** AJX Tax productises the overnight workflow people already trust — and makes the claim audit-ready.

---

## 5. Core user journeys

### Journey A — Overnight claim (MVP primary)

1. Select or create the financial year.  
2. Enter overnight counts by destination and month.  
3. Upload supporting evidence.  
4. Open a destination; create sample days; enter receipts; complete days.  
5. See average daily spend calculated automatically.  
6. See the average applied to qualifying overnights.  
7. Review the claim on Tax Position with provenance.

**Outcome:** “My overnight claim is built the same way as Calculator — and I can defend it.”

### Journey B — Evidence alongside the claim

1. Capture or upload roster, payslip, receipt, PDF, or screenshot.  
2. System confirms upload immediately (no AI wait).  
3. Optionally link evidence to a destination, sample day, or claim.  
4. Completeness improves without changing overnight counts.

**Outcome:** Proof sits with the claim; the overnight table stays authoritative.

### Journey C — Stay oriented

1. Open Home for the current FY.  
2. See overnight progress, sample-day gaps, and claim stance.  
3. Act on a short list (missing sample days, unlinked evidence).

**Outcome:** Soft awareness, not spreadsheet archaeology.

### Journey D — Accountant handoff

1. Export a package: summary, claim provenance, evidence index and files.  
2. Accountant reviews working papers — does not rewrite originals.

**Outcome:** Professional handoff without surrendering control.

### Journey E — Prove it

1. Expand the overnight claim: counts, averages, receipts, linked documents.  
2. Gaps are labelled honestly.

**Outcome:** Audit-ready without a separate theatre product in MVP.

### Journey F — Bring Calculator history forward

1. Import prior Calculator / planner data where it maps.  
2. Overnight counts and sample-day/receipt structures are preserved or clearly warned.  
3. Gaps flagged — never silently invented.

**Outcome:** Continuity of trust across product generations.

---

## 6. The emotional experience we want

| Feeling | In practice |
|---------|-------------|
| **Calm** | A known sequence — not a new methodology to learn under stress. |
| **In control** | User owns overnight counts; evidence never silently overwrites them. |
| **Fast** | Manual entry and uploads; no waiting on models. |
| **Confident** | Average and claim show their homework. |
| **Premium** | Finished, spacious, intentional — Apple · Stripe · Linear · Notion · Flighty feel. |

Emotional north star:

> I built my overnight claim the way I always have — and I can show every step.

---

## 7. The key moments that create trust

1. **Overnight entry is explicit** — the table is obviously the source of truth.  
2. **Upload succeeds instantly** — AI can come later; capture does not wait.  
3. **Sample days are concrete** — receipts in, day complete, average updates.  
4. **Numbers have parents** — average and claim drill to days, receipts, and overnight counts.  
5. **Roster never hijacks maths** — evidence only unless the user later accepts a suggestion (post-MVP).  
6. **Destructive actions are careful** — confirmations; undo where practical.  
7. **Errors speak human** — clear problem + next step.  
8. **Estimates stay humble** — indicative working papers, not lodged ATO truth.

---

## 8. Features that are essential (MVP)

### Overnight workflow (essential)

- FY create/select  
- Manual overnight counts by destination and month  
- Destination sample days and receipt entry  
- Complete sample day → average daily spend  
- Apply average to qualifying overnights  
- Claim visible on Tax Position with provenance  

### Evidence (essential)

- Upload and organise supporting documents  
- Optional links to destinations / sample days / claims  
- Clear status; retry on failure  

### Continuity (essential)

- Import path from Calculator where applicable  
- Accountant package export  

### Quality bar (essential)

- Skeletons, empty states, confirmations, drafts, undo where practical  
- Dark and light; phone and desktop  
- Performance that stays calm as years accumulate  

---

## 9. Features deliberately excluded (MVP and identity)

| Excluded | Why |
|----------|-----|
| **Generic expense tracker as the product** | Wrong mental model; abandons the proven workflow. |
| **Roster interpretation as a requirement** | Roster is evidence; overnight table is source of truth. |
| **AI as a dependency** | Happy path is manual + uploads; AI is a future assist. |
| **Auto-lodgement with the ATO** | Lodgement remains a human/professional act. |
| **Personalised tax advice** | We organise and calculate working papers; we do not advise. |
| **Full accounting / BAS / payroll** | Different job. |
| **Silent complete numbers without sources** | Destroys trust. |
| **AI that mutates overnight counts without confirmation** | Consequential changes require a human. |

Near-term non-goals for identity: native apps, bank feeds, ATO prefill, conversational assistant, Drive sync, accountant collaboration portal — expansion later, not required for the overnight spine to be true.

---

## 10. The future commercial vision

AJX Tax begins by productising the overnight workflow. It grows into a commercial platform **without abandoning** Simple · Reliable · Fast · Audit-ready.

### Later, on the same spine

- AI suggestions for receipt lines and (optionally) draft overnight counts from rosters — always human-accepted  
- Deeper Evidence Vault, Audit Mode, Accountant Mode  
- Multi-entity tenancy, billing, native clients, public API  

### The lasting idea

Sell **a defensible overnight claim that compounds year after year** — evidence retained, averages explainable, Tax Position trustworthy. The moat is the workflow and the proof trail, not a single model or parser.

---

## Product priorities (always)

**Simplicity · Clarity · Reliability · Trust**

For MVP sequencing, prefer: **Simple. Reliable. Fast. Audit-ready.**

When trade-offs appear, prefer the choice that makes the overnight workflow more true — not the choice that merely adds capability.

---

## Related documents

| Document | Role |
|----------|------|
| [ADR-024 Overnight workflow MVP foundation](../architecture/adr/024-overnight-workflow-mvp-foundation.md) | Decision record for this reset |
| [Overnight workflow feature](../features/overnight-workflow-mvp.md) | MVP feature spec |
| [MVP v1 scope](./mvp-v1-scope.md) | Day-one included/excluded |
| [Architecture product overview](../architecture/00-product-overview.md) | Short architecture-set orientation |
| [Commercial expansion](../architecture/14-commercial-expansion.md) | Platform principles for scale |
| [Product & engineering standards](../standards/00-overview.md) | Non-negotiable quality gates |
