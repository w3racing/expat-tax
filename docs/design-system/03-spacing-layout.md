# Spacing, layout, radius, elevation

## Spacing scale (4px base)

| Token | Rem | Px | Common use |
|-------|-----|-----|------------|
| `0` | 0 | 0 | — |
| `0.5` | 0.125 | 2 | Hair gaps |
| `1` | 0.25 | 4 | Icon gaps |
| `1.5` | 0.375 | 6 | Compact chip pad |
| `2` | 0.5 | 8 | Tight stack |
| `3` | 0.75 | 12 | Default inner gap |
| `4` | 1 | 16 | Page padding (phone) / card pad |
| `5` | 1.25 | 20 | Comfortable card pad |
| `6` | 1.5 | 24 | Section gap / tablet pad |
| `8` | 2 | 32 | Major section |
| `10` | 2.5 | 40 | Large breathe |
| `12` | 3 | 48 | Hero spacing |
| `16` | 4 | 64 | Desktop section |

**Rule:** Only use scale values. No `13px` or `18px` one-offs.

## Page padding

| Shell | Horizontal | Bottom (extra) |
|-------|------------|----------------|
| Phone | 16px + safe-area | Nav clearance ~72px + FAB |
| Tablet | 24px | — |
| Desktop | 32px content inset | — |

## Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 8px | Inputs, small chips |
| `radius-md` | 12px | Buttons, menus |
| `radius-lg` | 16px | **Cards** (default) |
| `radius-xl` | 20px | Sheets, large panels |
| `radius-2xl` | 24px | Hero cards, empty states |
| `radius-full` | 9999px | Avatars only (not primary buttons) |

Primary buttons use `radius-md` — pill buttons are avoided for product CTAs.

## Elevation (soft shadows)

| Token | CSS | Use |
|-------|-----|-----|
| `shadow-xs` | `0 1px 2px rgb(12 21 36 / 0.04)` | Inputs rest |
| `shadow-sm` | `0 1px 2px rgb(12 21 36 / 0.05), 0 4px 12px rgb(12 21 36 / 0.04)` | **Default card** |
| `shadow-md` | `0 2px 4px rgb(12 21 36 / 0.04), 0 12px 24px rgb(12 21 36 / 0.06)` | Raised / floating (FAB, popover) |
| `shadow-lg` | `0 8px 30px rgb(12 21 36 / 0.1)` | Modals |

Prefer **border + shadow-sm** on cards. No multi-coloured glow shadows.

## Z-index

| Layer | z |
|-------|---|
| Base | 0 |
| Sticky header | 20 |
| Bottom nav / sidebar | 30 |
| FAB | 40 |
| Overlay / sheet | 50 |
| Modal | 60 |
| Toast | 70 |

## Layout grids

- Phone: single column
- Tablet: 2-column card grids where content is peer cards
- Desktop: 12-col content; sidebar fixed; dashboards 2–3 columns
