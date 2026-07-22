# Accountant Mode

## Purpose

Let users invite their accountant into a **read-safe collaboration space** so EOFY handoff is calm, complete, and auditable — without ever letting the accountant alter original evidence.

## Promise

| Owner | Accountant |
|-------|------------|
| Owns vault, Drive, versions, claims | Views, comments, requests, exports |
| Can revoke access anytime | Cannot mutate originals |
| Sees every accountant action | Every action is audited |

## Invite flow

1. Owner opens Settings → Accountant Mode → **Invite accountant**
2. Enters email + optional message + FY scope (current / specific / all)
3. Selects permission grants (defaults recommended below)
4. Accountant receives invite (email magic link or Google sign-in)
5. Accept → collaboration becomes `active`
6. Accountant lands in **Accountant shell** (read-oriented UI)

Pending invites expire (e.g. 14 days). Owner can resend or revoke.

## Permissions

| Permission | Allows | Does not allow |
|------------|--------|----------------|
| **Read Only** | View evidence, versions (if granted), dashboard summaries, timeline | Edit fields, replace, archive, delete |
| **Comment** | Add comments on evidence / FY threads | Edit owner notes as if they were the owner |
| **Request Documents** | Create structured document requests | Upload into owner’s vault as owner |
| **Export Reports** | Download generated report packages | Change source data |
| **Generate Tax Package** | Build EOFY handoff package | Modify evidence |
| **Generate Working Papers** | Build working-papers bundle | Modify evidence |
| **Generate Income Summary** | Build income summary report | Modify payslips |
| **Generate Deduction Summary** | Build deduction summary report | Rebind claims |
| **Generate FX Report** | Build FX / ATO-rate conversion report | Change rates or amounts |
| **Generate Evidence Index** | Build indexed inventory of evidence | Delete index source rows |
| **Generate Audit Package** | Build audit package (optional history) | Alter version history |

**Read Only** is the baseline grant. Generate/export permissions imply read for the artefacts they need. Comment and Request Documents are additive.

Recommended default invite: Read Only + Comment + Request Documents + Generate Tax Package + Generate Evidence Index.

## Non-negotiable: no mutation of originals

Accountants **cannot**:

- Upload, replace, or restore evidence versions as the owner
- Edit extraction fields or tax categories
- Soft-delete / archive evidence
- Rebind claims to versions
- Connect or disconnect Google Drive
- Change owner profile or FY locks
- Soft-delete version history

If an accountant supplies a file (e.g. responding to their own request with a sample), it lands as a **collaboration attachment** on the request thread — not as owner evidence — unless the **owner** explicitly promotes it into the vault.

## Accountant shell UX

Distinct from owner Home:

- Calm header: “Viewing {Owner name} · FY {year}”
- Modules: completeness, missing insights, income/expense summaries, evidence library (read), comments, requests, generate panel
- No Capture FAB
- No Replace / Archive destructive actions
- Generate actions open confirmation sheets with audit notice

Owner can switch into “What my accountant sees” preview.

## Document requests

Accountant creates a request:

- Title, description, suggested document type, due date
- Status: `open` → `fulfilled` (owner) / `dismissed` / `cancelled`

Owner fulfills by linking existing evidence or capturing new evidence (owner-only capture). Fulfillment is audited.

## Comments

Threaded comments on `evidence_id` or FY-level collaboration board.

- Accountant and owner can comment if Comment grant is on
- Edits to comment body allowed only by author within a short window; deletes are soft and audited
- Comments never alter evidence metadata

## Generated packages

All Generate_* actions:

1. Check permission grant
2. Enqueue job
3. Write `accountant_audit_events`
4. Produce Blob artefact owned by `owner_user_id`
5. Notify owner + accountant when ready
6. Optionally mirror into owner Drive `Audit Package/` or `Tax Return/` per package type

Packages are immutable outputs; regenerating creates a new artefact version.

## Auditing

**Every** accountant action writes to `accountant_audit_events`:

| Always recorded | Examples |
|-----------------|----------|
| Who | accountant user id + email |
| Whose vault | owner user id |
| What | action type |
| When | timestamptz |
| Context | evidence id, FY, package id, IP/user-agent hash |
| Outcome | success / denied / failed |

Owner can view the audit trail in Accountant Mode settings. Audit events are append-only and retained with the collaboration / seven-year policy.

Denied permission attempts are also audited (`outcome=denied`).

## Security & RLS

- Collaborator SELECT on owner evidence when collaboration `active` and grant includes read
- INSERT limited to comments, requests, audit rows (via security definer or narrow policies)
- No UPDATE/DELETE on `evidence_*` for accountant role
- Blob download via signed URLs that check collaboration + grant
- Revoke sets collaboration `revoked_at` → immediate RLS deny

## Privacy

- Accountant sees only the invited owner’s scoped FY(s)
- Owner can revoke and optionally expire outstanding package links
- Accountants cannot see other clients’ data in this product model (no firm multi-client portal yet — future ADR)

## Related

- [ADR-015](./adr/015-accountant-mode.md)
- [Database](../database/09-accountant-mode.md)
- [API](../api/09-accountant-mode.md)
- [Feature](../features/15-accountant-mode.md)
