# Typography

## Families

| Role | Family | Why |
|------|--------|-----|
| Display / brand | **Sora** | Geometric, modern, premium — brand moments & empty-state headlines |
| UI / body | **Plus Jakarta Sans** | Excellent readability, calm professionalism at all sizes |
| Figures / refs | **IBM Plex Mono** | Tabular-friendly amounts & IDs (sparingly) |

Do not use Inter, Roboto, Arial, or system-ui as the brand voice.

Loaded via `@fontsource` for performance and privacy.

## Scale

| Token | Size | Line height | Weight | Use |
|-------|------|-------------|--------|-----|
| `display` | 36–40px / 2.25–2.5rem | 1.15 | 600 Sora | Brand, empty heroes |
| `title` | 28px / 1.75rem | 1.25 | 600 Sora | Screen titles (phone) |
| `heading` | 22px / 1.375rem | 1.3 | 600 Jakarta | Section headings |
| `subheading` | 18px / 1.125rem | 1.35 | 600 Jakarta | Card titles |
| `body` | 16px / 1rem | 1.55 | 400–500 Jakarta | Default copy |
| `body-sm` | 14px / 0.875rem | 1.5 | 400–500 Jakarta | Secondary |
| `caption` | 12px / 0.75rem | 1.4 | 500 Jakarta | Meta, timestamps |
| `overline` | 11px / 0.6875rem | 1.3 | 600 Jakarta | Uppercase labels (tracking wide) |
| `amount` | 16–22px | 1.2 | 500 Plex Mono | Currency |

## Rules

- Screen titles use **Sora**; everything else defaults to **Plus Jakarta Sans**
- Max ~70 characters line length for reading paragraphs
- Avoid all-caps except overlines (short labels)
- Amounts: always tabular feel; prefix `A$` or use `AUD` consistently in product copy
- Never shrink body below 14px for primary content on mobile
