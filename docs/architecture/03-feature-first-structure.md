# Feature-first architecture

## Principle

Organise by **business capability**, not by technical layer. Features own their UI, hooks, schemas, and API adapters. Shared kernels stay thin.

## Target repository layout

```text
/
├── docs/                          # This documentation set
├── public/
├── src/
│   ├── app/                       # Shell: providers, router, layouts
│   │   ├── providers/
│   │   ├── router/
│   │   └── layouts/               # PhoneLayout, TabletLayout, DesktopLayout
│   ├── features/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── capture/
│   │   ├── evidence/
│   │   ├── timeline/
│   │   ├── income/
│   │   ├── deductions/
│   │   ├── readiness/
│   │   ├── settings/
│   │   └── integrations-google/
│   ├── shared/
│   │   ├── components/            # Truly cross-feature UI
│   │   ├── hooks/
│   │   ├── lib/                   # supabase client, blob, cn, dates/FY
│   │   ├── schemas/               # Cross-cutting Zod
│   │   └── types/
│   ├── styles/
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   └── functions/
├── package.json
└── ...
```

## Feature module contract

Each feature folder should follow:

```text
features/<name>/
├── index.ts                 # Public API of the feature (exports only)
├── pages/                   # Route-level screens
├── components/              # Feature-local UI
├── hooks/                   # Query/mutation hooks
├── api/                     # Supabase / fetch adapters
├── schemas/                 # Zod schemas
├── types/                   # Feature types
└── utils/                   # Pure helpers
```

Rules:

1. **Other features import only from `features/<name>/index.ts`**
2. Cross-feature coupling goes through shared types or explicit public exports
3. **~300 lines max per file** — split by responsibility early
4. No circular imports between features
5. Route registration lives in `app/router`; pages live in features
6. **Domain types and Zod schemas** must be extractable to `packages/domain` for native clients ([Commercial expansion](./14-commercial-expansion.md))

## Future monorepo (commercial clients)

When iOS/Android/desktop ship, extract without rewrite:

```text
packages/domain/     # types, Zod, FY utils — shared by all clients
packages/api-client/ # SDK generated from OpenAPI
apps/web/            # current Vite SPA
apps/ios|android|desktop/
```

Until then, keep domain logic out of React components; prefer `shared/` and feature `schemas/` that can move cleanly.

## Shared vs feature

| Put in `shared/` | Put in `features/` |
|------------------|--------------------|
| Button, Input (shadcn wrappers) | Evidence card, Capture sheet |
| `formatAud`, `getCurrentFy` | Deduction category mapping UI |
| Supabase client factory | Evidence list query keys |
| Device breakpoint hook | Google Picker mount logic |

## State ownership

| Kind | Home |
|------|------|
| Server data | TanStack Query (feature hooks) |
| Form draft | React Hook Form |
| Ephemeral UI | Local React state |
| Auth session | Supabase Auth + thin provider |
| Device shell | Layout derived from breakpoint |

## Testing posture (when tests are introduced)

- Unit: Zod schemas, FY utils, classifiers mappers
- Component: critical capture + evidence flows
- Prefer co-located `*.test.ts` next to the unit under test

## Enforcement

- ESLint `import/no-restricted-paths` (or equivalent) to protect feature boundaries
- CI fails on TypeScript errors; no `any` without explicit, rare escape hatch documented in ADR
