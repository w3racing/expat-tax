# Evidence library & detail

## Purpose

Browse, search, filter, and correct all evidence for a FY.

## Library

- Filters: kind, status, category, month, trip, employer
- Search: title, merchant, notes
- Sort: newest, amount, needs review first
- Phone: card list; Desktop: denser list + optional preview pane

## Detail

- Preview (image/PDF) of **current version**
- Editable fields: kind, dates, amounts, merchant, category, trip, tags
- Status + event timeline
- **Version history** — replace, archive, restore, compare
- Reprocess action (re-queue AI on current version)
- Soft archive (never permanent delete)

## AI-extracted fields

Detail view surfaces AI output with per-field confidence:

- High confidence fields appear as normal editable values
- Low confidence fields are visually gentle-highlighted
- `amount_aud` shows FX conversion note when foreign currency was normalised via ATO monthly rate
- Suggested tax category is editable; user override is permanent until user clears correction

## Correction philosophy

Editing a field marks provenance (`user_corrected`) without fighting the user. AI suggestions remain visible as secondary where useful. Reprocess never overwrites corrected fields silently.

## Duplicates

When AI flags a possible duplicate, show link to candidate with Confirm / Not a duplicate actions.

## Acceptance

- No horizontal scroll
- PDF and image preview on all shells
- Filters persist in URL query params
