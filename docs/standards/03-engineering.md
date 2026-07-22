# Engineering standards

Technical requirements that keep AJX Tax feeling premium under real load and across devices.

## 1. Responsive & keyboard accessible

### Responsive

- Mobile-first; explicit phone / tablet / desktop shells ([ADR-008](../architecture/adr/008-responsive-shells.md))
- Touch targets ≥ 44×44px on phone
- No essential content trapped in hover-only or horizontal-scroll-only layouts
- Test at: 390×844, 768×1024, 1280×800, 1440×900

### Keyboard & accessibility

| Requirement | Detail |
|-------------|--------|
| Full keyboard path | All primary flows completable without a pointer |
| Focus visible | `--ring` on every interactive control; never `outline: none` without replacement |
| Focus order | Matches visual order; dialogs trap focus correctly |
| Screen readers | Labels, roles, live regions for status/errors/progress |
| Contrast | WCAG AA minimum (see design system) |
| Reduced motion | Honour `prefers-reduced-motion` |
| Shortcuts | Desktop command palette (⌘K) for major actions; document in UI |

## 2. Dark Mode and Light Mode (day one)

Both themes are first-class — not a post-launch patch.

| Rule | Detail |
|------|--------|
| Token-based | All colours via CSS semantic tokens; no hardcoded hex in components |
| Dual palettes | Light and dark definitions in `tokens.css` (or equivalent) |
| System + user | Follow `prefers-color-scheme` by default; Settings can override and persist |
| Parity | Dark is designed — not inverted light. Same hierarchy, calm surfaces, cerulean accent adapted for contrast |
| Assets | Illustrations/SVGs work on both (currentColor or dual assets) |
| Charts / status | Semantic colours remain distinguishable in both themes |
| Flash prevention | Apply theme class before paint where possible (no bright flash on load) |

Native clients later consume the same token names.

## 3. Performance at scale

Target: **excellent** UX with **hundreds of thousands** of records and **many years** of documents per account/org.

### Data & API

| Practice | Detail |
|----------|--------|
| Keyset pagination | Evidence lists: `(occurred_on, id)` — never unbounded `SELECT *` |
| Snapshots | Dashboard aggregates from precomputed snapshots; recompute async |
| Partial indexes | Hot filters (`needs_review`, active jobs) |
| Selectivity | List endpoints return summary DTOs; detail on demand |
| Search | Server-side search / filters; do not load full FY into memory on the client |
| Jobs | Heavy work on job fabric; UI polls or subscribes to job rows |
| Blob | Binaries in object storage; never Postgres LOBs |
| FY scoping | Default queries scoped to active financial year; “all years” is explicit and paginated |

### Client

| Practice | Detail |
|----------|--------|
| Virtualize | Long lists (react-window / virtualizer) when rows exceed ~50–100 visible |
| Query cache | TanStack Query with stable keys; avoid refetch storms |
| Code split | Route-level lazy loading |
| Images | Thumbnails / progressive preview; full file on demand |
| Bundle | Keep feature boundaries; no god-modules |
| Measure | Track LCP/INP for Home, Evidence, Capture; budget regressions in CI when tooling exists |

### Forbidden at scale

- Loading entire evidence history into React state
- Client-side-only filtering of “all years”
- N+1 detail fetches in list render
- Synchronous AI/OCR on the request path that blocks capture acknowledgement

See also [Indexes & performance](../database/03-indexes-performance.md).

## 4. Reliability habits

- Idempotent mutations where retries are expected (uploads, job enqueue)
- Optimistic UI only when rollback is defined
- Offline-tolerant capture queue where product requires it (document in feature spec)
- Observability: client error reporting + server job failure metrics

## 5. Code quality gates

- Strict TypeScript; no unexplained `any`
- ~300 lines max per source file
- Feature-first boundaries; domain logic extractable for native clients
- Shared UX primitives for standards U1–U8 (skeletons, empty, confirm, progress, upload, errors, drafts, undo)
