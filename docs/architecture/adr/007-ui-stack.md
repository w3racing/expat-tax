# ADR-007: Tailwind + shadcn/ui + Framer Motion

## Status

Accepted

## Context

We need a premium, accessible component baseline without inventing primitives, plus intentional motion.

## Decision

- **Tailwind CSS** for styling tokens and layout
- **shadcn/ui** (Radix) copied into the repo as owned components
- **Framer Motion** for shell, sheet, and list motion
- Custom visual theme per design system (not default shadcn look)

## Consequences

- Components are owned and customisable
- Design tokens must override shadcn defaults early
- Motion gated by `prefers-reduced-motion`
