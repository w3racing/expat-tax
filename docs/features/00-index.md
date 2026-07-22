# Features index

Feature specifications define behaviour before implementation. Each spec includes purpose, user flows, shells, data, and acceptance criteria.

| Feature | Doc | Priority |
|---------|-----|----------|
| **Overnight workflow (MVP spine)** | [overnight-workflow-mvp.md](./overnight-workflow-mvp.md) · [ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md) | **P0** |
| **Destination workspace** | [destination-workspace-mvp.md](./destination-workspace-mvp.md) | **P0** |
| **Sample Day workflow** | [sample-day-workflow-mvp.md](./sample-day-workflow-mvp.md) | **P0** |
| Auth & session | [01-auth.md](./01-auth.md) | P0 |
| Onboarding | [02-onboarding.md](./02-onboarding.md) | P0 |
| Dashboard | [03-dashboard.md](./03-dashboard.md) | P0 |
| Capture | [04-capture.md](./04-capture.md) | P0 |
| Evidence library | [05-evidence.md](./05-evidence.md) · **MVP vault:** [evidence-vault-mvp.md](./evidence-vault-mvp.md) | P0 |
| Timeline & trips | [06-timeline.md](./06-timeline.md) | P1 |
| Income & payslips | [07-income.md](./07-income.md) | P1 |
| Deductions | [08-deductions.md](./08-deductions.md) | P1 |
| Readiness | [09-readiness.md](./09-readiness.md) | P0 |
| Settings | [10-settings.md](./10-settings.md) | P0 |
| Google Drive | [11-google-drive.md](./11-google-drive.md) | P0 |
| AI ingest | [12-ai-ingest.md](./12-ai-ingest.md) | P0 |
| Evidence Vault | [13-evidence-vault.md](./13-evidence-vault.md) · **MVP:** [evidence-vault-mvp.md](./evidence-vault-mvp.md) | P0 |
| Document versions | [14-document-versions.md](./14-document-versions.md) | P0 |
| Accountant Mode | [15-accountant-mode.md](./15-accountant-mode.md) · **MVP export:** [accountant-export-mvp.md](./accountant-export-mvp.md) | P1 |
| Audit Mode | [16-audit-mode.md](./16-audit-mode.md) | P0 |
| Migration wizard | [17-migration-wizard.md](./17-migration-wizard.md) | P0 |

## Product principles (all features)

1. **Overnight workflow is the MVP spine** — not a generic expense tracker ([ADR-024](../architecture/adr/024-overnight-workflow-mvp-foundation.md))
2. Overnight table is source of truth; roster is evidence only
3. Capture is sacred — never block on AI; AI is never an MVP dependency
4. Calm premium UI — no spreadsheet density
5. Correctable intelligence — every AI field is editable (when AI ships)
6. FY-aware by default
7. Shell-appropriate chrome
8. **Standards compliance** — [Product & engineering standards](../standards/00-overview.md) (skeletons, empty states, trust, a11y, themes, scale)
9. **Commercial expansion** — each spec must state how the feature works with org accounts, native clients, entitlements, and adapters (or N/A with justification)

Priorities on every screen: **Simple. Reliable. Fast. Audit-ready.**

## Feature spec template (required sections)

Every new feature spec under `docs/features/` must include:

- Purpose
- User flows
- Data / API
- Acceptance criteria
- **Standards compliance** — map to U1–U15 / [Definition of done](../standards/04-definition-of-done.md); list any **Standards exceptions**
- **Commercial expansion** — org tenancy, billing entitlement, native/API parity, adapter hooks, audit implications
