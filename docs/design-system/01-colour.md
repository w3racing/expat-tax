# Colour

## Brand direction

Cool atmospheric canvas (altitude / clear sky) with deep navy ink and a single **cerulean** accent. Professional, calm, travel-adjacent — not retail banking purple, not cream-and-terracotta.

## Core palette

| Name | Hex | Role |
|------|-----|------|
| Mist 50 | `#F3F6FA` | App canvas |
| Mist 100 | `#E7EDF5` | Subtle sections / wash |
| Cloud | `#FFFFFF` | Elevated surfaces / cards |
| Fog | `#F7F9FC` | Nested surface / input fill |
| Ink 950 | `#0C1524` | Primary text |
| Ink 700 | `#3D4F63` | Secondary text |
| Ink 500 | `#6B7C8F` | Tertiary / placeholders |
| Ink 300 | `#A8B5C4` | Disabled |
| Line | `#D7E0EB` | Borders / dividers |
| Line soft | `#E8EEF5` | Hairline on cards |
| Cerulean 600 | `#0B6E99` | Primary accent / CTA |
| Cerulean 700 | `#085578` | Accent pressed / hover |
| Cerulean 100 | `#DCEFF6` | Accent soft fill |
| Cerulean 50 | `#EFF8FB` | Accent wash |
| Emerald 600 | `#1F7A4D` | Success / ready |
| Emerald 100 | `#DCEEE4` | Success soft |
| Amber 600 | `#A65F00` | Warning / needs review |
| Amber 100 | `#F5E6CC` | Warning soft |
| Rose 600 | `#C0392B` | Danger / destructive |
| Rose 100 | `#F8E2DF` | Danger soft |

## Semantic tokens (CSS)

```text
--background            Mist 50
--background-accent     subtle mist→sky gradient (canvas only)
--foreground            Ink 950
--muted                 Fog
--muted-foreground      Ink 700
--card                  Cloud
--card-foreground       Ink 950
--popover               Cloud
--border                Line
--input                 Line
--ring                  Cerulean 600
--primary               Cerulean 600
--primary-foreground    Cloud
--primary-soft          Cerulean 100
--secondary             Mist 100
--secondary-foreground  Ink 950
--accent                Cerulean 50
--accent-foreground     Cerulean 700
--success               Emerald 600
--success-foreground     Cloud
--success-soft          Emerald 100
--warning               Amber 600
--warning-foreground     Ink 950
--warning-soft          Amber 100
--destructive           Rose 600
--destructive-foreground Cloud
--destructive-soft      Rose 100
```

## Dark mode palette (day one)

Dark is a designed dual of light — not a CSS invert. Semantic token names stay identical; values change under `.dark` / `[data-theme="dark"]`.

| Token role | Dark direction |
|------------|----------------|
| Canvas | Deep navy-ink (`#0B1220` range) with subtle mist gradient |
| Cards / elevated | Slightly lifted surface (`#121A2A`–`#162033`) |
| Text | Mist / cloud hierarchy (high contrast body, softer secondary) |
| Borders | Low-contrast cool lines — visible, not harsh |
| Primary | Cerulean adjusted for WCAG on dark surfaces |
| Status soft fills | Desaturated soft fills; text remains AA |

System preference + Settings override; persist user choice. Apply theme class before first paint to avoid flash.

## Status colours (evidence)

| Status | Text | Soft fill |
|--------|------|-----------|
| uploaded | Ink 700 | Mist 100 |
| processing | Cerulean 700 | Cerulean 100 |
| ready | Emerald 600 | Emerald 100 |
| needs_review | Amber 600 | Amber 100 |
| failed | Rose 600 | Rose 100 |

## Usage rules

- **One accent** — Cerulean for primary actions and focus only
- **Soft fills** for status and chips; never neon solids for large areas
- Canvas may use a **whisper** gradient; cards stay solid white
- Do not use colour alone for status — pair with label/icon
- Dark mode: **required from day one** — dual semantic token sets (light + dark); never hardcode light-only hex in components. See [Engineering standards](../standards/03-engineering.md).
