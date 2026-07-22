# Accountant Mode

## Purpose

Invite an accountant to collaborate safely: read, comment, request documents, and generate packages — never modify original evidence. Every action is audited.

## Owner flows

1. Settings → Accountant Mode → Invite
2. Choose email, FY scope, permissions
3. Track pending / active collaborators
4. Fulfill document requests
5. Review accountant audit trail
6. Revoke anytime

## Accountant flows

1. Accept invite
2. Browse read-only vault + insights
3. Comment (if granted)
4. Request documents (if granted)
5. Generate / export packages (if granted)
6. Download ready artefacts

## Permissions

- Read Only
- Comment
- Request Documents
- Export Reports
- Generate Tax Package
- Generate Working Papers
- Generate Income Summary
- Generate Deduction Summary
- Generate FX Report
- Generate Evidence Index
- Generate Audit Package

## Hard rules

- Accountant never modifies original evidence or versions
- Files they attach to requests are not vault evidence until the owner promotes them
- Every view of sensitive download, comment, request, generate, export, invite, revoke, and denial is audited

## UX

- Owner: settings + request inbox + audit log
- Accountant: distinct shell without Capture / Replace
- Calm, professional — Linear/Stripe clarity, not portal clutter

## Acceptance

- Invite → accept → read works end-to-end
- Missing grant → 403 + audit `denied`
- Revoke removes access immediately
- Generate actions produce downloadable packages without altering source evidence
- Owner can list full audit history for a collaboration
