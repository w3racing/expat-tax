# Responsive strategy & navigation

## Device shells

The app does not use one layout that “kinda works.” It selects a **shell** by viewport:

| Shell | Breakpoints (Tailwind) | Navigation | Content |
|-------|------------------------|------------|---------|
| Phone | `< md` (&lt; 768px) | Bottom nav + floating quick action | Single column, full-bleed sheets |
| Tablet | `md`–`lg` (768–1023px) | Collapsible side nav | Larger cards, 2-column where useful |
| Desktop | `lg+` (≥ 1024px) | Permanent sidebar | Multi-column, denser analytics, shortcuts |

Exact pixel tokens live in the design system; shells must not depend on user-agent sniffing.

## Phone

- Bottom tab bar: Home, Evidence, Capture (centre / FAB), Timeline, Settings (or Readiness)
- **Floating quick actions** for Capture (camera, upload, Drive)
- Thumb-zone primary actions
- Full-screen capture and detail as sheets/routes
- No persistent sidebar
- Touch targets ≥ 44×44 pt equivalent

## Tablet

- Collapsible left navigation (icon rail ↔ labelled)
- Dashboard cards at larger visual weight
- Optional split view: list | detail in landscape
- Portrait: closer to phone content density but with side nav

## Desktop

- Permanent sidebar with section groups
- Keyboard shortcuts (see below)
- Multi-column dashboard and evidence workspace
- Hover affordances allowed; never required for core tasks
- Command palette (e.g. ⌘K) for power users

## Navigation model

Routes are shared; **chrome** changes per shell.

```text
/                     Dashboard / Home
/evidence             Evidence library
/evidence/:id         Evidence detail
/capture              Capture hub
/timeline             FY timeline / trips
/income               Income & payslips
/deductions           Deductions workspace
/readiness            Return readiness
/settings             Preferences & connections
/settings/google      Google integration
```

Deep links must work on all shells.

## Keyboard shortcuts (desktop)

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Command palette |
| `C` | Open capture |
| `E` | Go to evidence |
| `G` then `H` | Go home (sequence) |
| `G` then `R` | Go readiness |
| `Esc` | Close sheet/modal |
| `?` | Shortcut help |

Shortcuts are disabled while typing in inputs.

## Motion & touch

- Framer Motion for shell transitions, sheet present/dismiss, list item layout
- Prefer subtle shared-element or opacity/translate — not novelty animation
- Respect `prefers-reduced-motion`
- Swipe-to-dismiss sheets on phone where expected
- Pull-to-refresh only where list semantics warrant it

## No horizontal scroll

- Layouts use `min-w-0`, truncation, wrapping, and responsive grids
- Tables on small screens become stacked rows or horizontal **card lists**, not overflow tables
- Wide analytics only on desktop shell

## Implementation notes

- `useDeviceShell()` returns `'phone' | 'tablet' | 'desktop'`
- `AppShell` switches layout components; pages remain mostly shell-agnostic with optional `*ByShell` variants when layout must diverge
- Safe-area insets for notched phones (`env(safe-area-inset-*)`)
