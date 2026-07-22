# Patterns

## Cards

Default container for interactive groupings.

```text
AppCard
├── optional SectionHeader
├── content (spacious)
└── optional footer actions
```

- `rounded-lg` (16px), `shadow-sm`, `border-border`, `bg-card`
- Padding `p-4` phone / `p-5` tablet+
- Do not nest cards more than one level deep

## Progressive disclosure

| Level | Example |
|-------|---------|
| Summary | Evidence row: merchant, amount, status |
| Peek | Sheet with key fields |
| Full | Detail route with preview + history |

Use chevrons / “Show details” — never dump OCR JSON by default.

## Dashboard

World-class **insights** Home — not a control panel or tax form.

Composition:

1. Estimated outcome (refund / payable) — hero amounts
2. Evidence completeness ring
3. Missing-document insight cluster
4. Quick actions
5. Travel pulse (days + countries)
6. Recent uploads rail + AI suggestions
7. Income / expense / investment summary cards with simple charts
8. ATO alerts (quiet)

Prefer: cards, rings, sparklines, soft bars, donuts, timelines, insight chips.

Avoid: dense KPI strips, multi-axis charts on phone, large tables, lodgement forms.

## Timeline

- Vertical rail with soft nodes
- Day/month labels in caption style
- Event cards attach to rail
- Landscape tablet/desktop: optional dual column

## Quick actions

- Phone: FAB → action sheet (Camera, Upload, Drive)
- Desktop: toolbar + ⌘K commands
- Max 4–5 actions visible; rest in overflow

## Empty states

Structure:

1. Soft illustration (meaningful, monochrome/cerulean wash)
2. Display or heading title
3. One supporting sentence
4. One primary CTA
5. Optional secondary text link

Tone: confident, light — never blaming.

Required on every zero-data surface — see [Product UX standards](../standards/01-product-ux.md).

## Illustrations

- SVG preferred; stroked, minimal scenes (envelope, plane path, folder calm)
- Colours from palette only
- Max one illustration per empty view
- No stock photo collages

## Skeletons

Every async screen/region uses layout-matched skeletons (`Skeleton`, list/card variants). Prefer section skeletons over full-shell spinners. See standards U1.

## Confirmations & undo

- Destructive → `ConfirmDialog` / sheet; high-impact → typing gate
- Soft-delete / reversible edits → toast with **Undo** (real API revert)

## Progress, uploads, processing

- Long jobs → `JobProgress` (determinate or phased)
- Uploads → status + **Retry**
- Documents → persistent processing status pill (queued → ready / failed)

## AI & figures

- Suggestions always show confidence + short rationale
- Calculated amounts offer “Source” / drill-in to evidence
- Financial figures link to audit trail (amount, FX, actor, time)

## Lists vs tables

- Phone/tablet: cards or rows  
- Desktop: still prefer refined rows; true `<table>` only for rare export previews
- Virtualize long lists; never load unbounded history
