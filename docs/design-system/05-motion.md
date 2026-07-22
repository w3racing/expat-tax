# Motion

## Goals

Subtle, fast, meaningful. Motion explains hierarchy and state — it does not entertain.

## Tokens

| Token | Value | Use |
|-------|-------|-----|
| `duration-fast` | 150ms | Hover, colour, opacity |
| `duration-normal` | 220ms | Sheets, fades, route |
| `duration-slow` | 320ms | Rare emphasis |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances |
| `ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | State morphs |
| `spring-soft` | stiffness 380, damping 32 | FAB / sheet (Framer) |

## Signature patterns (ship these)

1. **Route fade** — opacity 0→1 + 4px Y (phone/tablet); quieter on desktop  
2. **Sheet present** — bottom sheet spring on phone; centre dialog scale+fade on desktop  
3. **Status crossfade** — evidence status pill colour/label morph 220ms  
4. **List layout** — Framer `layout` for reorder/filter (subtle)  
5. **FAB press** — scale 0.96 on tap

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* durations → 0.01ms; disable springs; keep opacity if needed for state */
}
```

Framer: use shared `MotionConfig` reducedMotion="user".

## Anti-patterns

- Looping attention bounce
- Parallax on dashboards
- Staggered cascades of 10+ items on every load
- Glow pulses on CTAs
