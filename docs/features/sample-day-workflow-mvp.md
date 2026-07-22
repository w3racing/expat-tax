# Sample Day workflow

**Status:** Canonical MVP  
**Related:** [Destination workspace](./destination-workspace-mvp.md) · [Overnight workflow](./overnight-workflow-mvp.md)

## Language

Use plain language. Prefer **Complete** / **Make changes** / **In progress** — never “lock”, “unlock”, or other technical jargon.

## Workflow

Create Sample Day → Enter receipts → Review totals → Complete Sample Day

Once complete:

1. The day becomes **read-only**  
2. The daily total contributes to the **destination average**  
3. The average updates **immediately**  
4. **Tax Position** updates automatically (destination daily rate ← average; claim = nights × rate)

The user can **Make changes** (reopen) if edits are needed, then complete again.

## Display

| Field | Notes |
|-------|--------|
| Receipt count | Number of receipt lines |
| Currency | Primary currency on the day |
| Daily total / AUD equivalent | Sum of receipt AUD amounts |
| Notes | Free text |
| Completion status | In progress / Completed |
| Linked evidence | Optional Evidence Vault links |

## Incomplete days

Days still in progress never affect the average.
