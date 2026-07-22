# Accountant Mode API

## Owner endpoints

| Function | Purpose |
|----------|---------|
| `invite-accountant` | Create pending collaboration + grants; send invite |
| `update-accountant-grants` | Change permissions; audit |
| `revoke-accountant` | Immediate revoke |
| `list-accountant-audit` | Owner-visible audit trail |
| `fulfill-document-request` | Link evidence to request (owner) |
| `preview-accountant-view` | Optional; same read model as accountant |

## Accountant endpoints

| Function | Purpose |
|----------|---------|
| `accept-accountant-invite` | Bind user id; activate |
| `list-client-vault-summary` | Dashboard-like read model |
| `get-evidence-readonly` | Evidence detail without mutate actions |
| `create-accountant-comment` | Requires `comment` |
| `create-document-request` | Requires `request_documents` |
| `request-package` | Requires matching generate_* or `export_reports` |
| `download-package` | Requires grant; audited |

## Package types

| `package_type` | Required permission |
|----------------|---------------------|
| `tax_package` | `generate_tax_package` |
| `working_papers` | `generate_working_papers` |
| `income_summary` | `generate_income_summary` |
| `deduction_summary` | `generate_deduction_summary` |
| `fx_report` | `generate_fx_report` |
| `evidence_index` | `generate_evidence_index` |
| `audit_package` | `generate_audit_package` |
| `generic_report` | `export_reports` |

## Enforcement

Every mutating or sensitive read path:

1. Resolve collaboration
2. Assert `status=active`
3. Assert FY in scope
4. Assert permission
5. Perform action **or** return 403
6. **Always** write `accountant_audit_events` (including denials)

## Guarantees

- No accountant endpoint accepts evidence binary upload into owner vault
- No accountant endpoint updates `evidence_versions` or extraction fields
- Package jobs run with service role but only write artefacts + audit under owner id
