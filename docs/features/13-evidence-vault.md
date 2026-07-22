# Evidence Vault

## Purpose

Give users durable control over their tax evidence across the entire financial year.

The vault is the trust layer behind capture. Every file is kept in:

1. metadata
2. app cloud storage
3. the user's Google Drive

## User promise

- Your files are organised automatically
- Your Drive stays readable and yours
- Deleted evidence is archived, not destroyed
- Backups are created monthly
- Files remain recoverable for seven years

## Core behaviours

### Vault bootstrap

- On Drive connect, create the managed AJX folder tree
- Save folder ids permanently
- Create missing FY folders as needed

### Automatic placement

- Upload starts in a provisional location if classification is not final
- After AI or user correction, the file is moved to the resolved target folder
- Moves are quiet and auditable

### Health and sync

Per file health states:

- `stored`
- `mirrored`
- `needs_attention`
- `archived`
- `backup_complete`

### Rename / replace / delete

- Rename: sync visible file name, keep the same file id
- Replace: create a new **document version** (prior version kept forever within retention)
- Delete/trash: archive the mirror state, preserve the vault record and Blob copy
- Restore: restore the archived record and re-link or recreate the Drive mirror
- Full version UX: see [14-document-versions.md](./14-document-versions.md)

### Conflict resolution

When app and Drive disagree, default to preservation:

- keep all revisions
- never auto-destroy evidence
- escalate only when a human decision is truly needed

## Acceptance

- User can trust that every uploaded file is mirrored into Drive
- User can see vault state without technical jargon
- Archived items can be restored
- Seven-year retention is enforceable
- Monthly encrypted backup status is available
