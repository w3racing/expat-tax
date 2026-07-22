# AJX Tax Design System

**Status:** Canonical — implement UI only against this system.  
**Feel:** Apple · Stripe · Linear · Notion · Flighty  
**Not:** Spreadsheets, dense tax forms, MYOB/Xero aesthetics

## Documents

| Doc | Contents |
|-----|----------|
| [00-principles.md](./00-principles.md) | Goals, do/don't, accessibility |
| [01-colour.md](./01-colour.md) | Palette, semantic tokens, light/dark, contrast |
| [02-typography.md](./02-typography.md) | Fonts, scale, usage |
| [03-spacing-layout.md](./03-spacing-layout.md) | Spacing, radius, elevation, grids |
| [04-iconography.md](./04-iconography.md) | Icon set, sizes, rules |
| [05-motion.md](./05-motion.md) | Animation tokens & patterns |
| [06-components.md](./06-components.md) | Primitive + product components |
| [07-patterns.md](./07-patterns.md) | Cards, skeletons, empty states, trust patterns |
| [08-responsive.md](./08-responsive.md) | Shells, touch, breakpoints |
| [09-content-voice.md](./09-content-voice.md) | Product voice & empty-state copy |

Product UX and trust gates: [`docs/standards/`](../standards/00-overview.md).

## Living styleguide

In-app route: `/design-system` (dev reference, not a product page).

## Implementation map

| Spec | Code |
|------|------|
| Colour / type / space | `src/styles/tokens.css` |
| Tailwind theme bridge | `src/styles/index.css` |
| Motion helpers | `src/shared/lib/motion.ts` |
| Primitives | `src/shared/components/ui/*` |
| Product components | `src/shared/components/ajx/*` |
| Public exports | `src/shared/components/index.ts` |
| Living styleguide | `src/app/pages/design-system-page.tsx` → `/design-system` |
