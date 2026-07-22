# Principles

## Design goals

| Goal | Meaning in AJX Tax |
|------|-------------------|
| Mobile-first | Phone shell is the default design target; larger shells enhance |
| Responsive | Explicit phone / tablet / desktop compositions |
| Elegant | Restraint over decoration; every element earns its place |
| Calm | Soft surfaces, quiet colour, no alarmist UI |
| Beautiful typography | Distinctive type, clear hierarchy, generous leading |
| Large touch targets | Minimum 44×44px interactive areas on touch |
| Excellent accessibility | WCAG AA, focus visible, SR labels, reduced motion |
| Fast | Lightweight motion, no layout thrash, optimistic UI |
| Minimal | Progressive disclosure; hide complexity until needed |
| Subtle animations | Presence and hierarchy — never noise |

## Prefer

- **Cards** — rounded, soft-shadowed surfaces for interactive groups
- **Progressive disclosure** — summary first, detail on demand
- **Dashboards** — calm overview, not a control panel
- **Timelines** — chronological narrative for travel/evidence
- **Quick actions** — FAB / command palette / contextual shortcuts
- **Beautiful empty states** — illustration + one sentence + one CTA
- **Meaningful illustrations** — sparse, brand-aligned, never clipart spam
- **Consistent spacing** — spacing scale only; no magic numbers
- **Skeleton loading** — layout-matched, never blank screens
- **Trust affordances** — confidence, provenance, audit trails visible when needed

## Avoid

- Spreadsheet / grid-of-cells layouts
- Dense multi-field forms on one screen
- Traditional accounting chrome (ledgers, green-on-black totals, audit tables as home)
- Purple fintech gradients, neon glows, emoji chrome
- Stat-strip clutter and badge spam on heroes
- Horizontal scrolling
- Technical error messages, unexplained AI, orphan financial figures
- Light-only hardcoded colours (dark mode is day one)

## Interaction philosophy

1. **Capture is sacred** — one tap to start; never block on AI  
2. **One job per view** — one headline, one primary action  
3. **Correctable intelligence** — AI suggests; humans decide  
4. **Native feel** — shells adapt; touch and keyboard both first-class  
5. **Simplicity, clarity, reliability, trust** — see [Standards](../standards/00-overview.md)

## Accessibility non-negotiables

- Contrast ≥ 4.5:1 for body text; ≥ 3:1 for large text/UI
- Focus rings on all keyboard paths (`--ring`)
- `prefers-reduced-motion: reduce` disables non-essential motion
- Icon-only controls have `aria-label`
- Forms associate labels; errors announced
- Hit area ≥ 44px on phone (padding may extend beyond visual)
