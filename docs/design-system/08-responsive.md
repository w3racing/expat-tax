# Responsive behaviour

## Breakpoints

| Shell | Width | Chrome |
|-------|-------|--------|
| Phone | `<768px` | Bottom nav + FAB |
| Tablet | `768–1023px` | Collapsible side nav |
| Desktop | `≥1024px` | Permanent sidebar + shortcuts |

## Touch

- Min target 44×44px
- Spacing between adjacent targets ≥ 8px
- Swipe-to-dismiss sheets where platform-expected
- No hover-only essential actions

## Desktop power

- Focus rings always available
- Tooltips on icon rails
- Keyboard shortcuts documented in Settings / `?`

## Safe areas

Honor `env(safe-area-inset-*)` on phone shells for nav and FAB.
