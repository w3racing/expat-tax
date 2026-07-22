# Product UX standards

**Priorities:** Simplicity · Clarity · Reliability · Trust  
**Audience:** All product surfaces (web now; native later via same contracts)

## 1. Skeleton loading states

Every screen and major region that fetches data **must** show a skeleton that matches the eventual layout (shape, spacing, hierarchy) — never a blank canvas or a generic full-page spinner as the only feedback.

| Rule | Detail |
|------|--------|
| Match layout | Skeleton mirrors cards, rails, rings, and list rows of the loaded view |
| Region-scoped | Prefer section skeletons over blocking the whole shell |
| Duration | Show within 100ms of pending; avoid flicker with a short delay (~150–200ms) only if flash risk is high |
| Transition | Cross-fade or content swap; no layout jump |
| Shared components | Use design-system `Skeleton` / list / card variants — do not invent one-off placeholders |

**Forbidden:** empty white/dark void; “Loading…” text alone; spinner covering content that could skeletonize.

## 2. Empty states

Every list, library, dashboard section, and settings panel that can have zero items **must** use an attractive empty state.

Structure (see also [design patterns](../design-system/07-patterns.md)):

1. Soft illustration (brand palette only)
2. Clear heading
3. One helpful supporting sentence (what to do next)
4. One primary CTA
5. Optional secondary link (docs, import, connect Drive)

Tone: confident and calm — never blaming (“You haven’t uploaded anything yet” → “Capture your first document”).

## 3. Destructive confirmations

Any action that deletes, archives permanently, revokes access, disconnects integrations, or cannot be trivially reversed **requires** an explicit confirmation.

| Requirement | Detail |
|-------------|--------|
| Dialog / sheet | Name the object; state consequence; primary = cancel (safe), destructive = explicit verb |
| Typing gate | For high-impact (delete account, wipe FY, revoke accountant): confirm by typing a short phrase |
| Soft delete default | Prefer archive / soft-delete + undo window over hard delete |
| No hover-only delete | Destructive controls must be reachable and confirmable via keyboard |

## 4. Progress for long-running tasks

Any task expected to take more than ~2 seconds (AI ingest, vault sync, audit package, migration, bulk export) **must** show progress.

| Pattern | When |
|---------|------|
| Determinate bar / % | Known steps or byte progress (upload, zip) |
| Step list | Multi-phase jobs (classify → extract → FX → vault) |
| Indeterminate + status line | Unknown duration, with current phase label |
| Backgroundable | User can leave the screen; status persists on the document / job row |
| Completion | Success toast or inline success; failure with retry |

Jobs are server-backed (`processing_jobs`); UI never pretends local-only progress for durable work.

## 5. Uploads — status and retry

| State | UI |
|-------|-----|
| Queued | Subtle pending indicator |
| Uploading | Progress (bytes or %) + cancel where safe |
| Processing | Distinct from upload (see trust standards) |
| Ready | Success affordance (quiet) |
| Failed | Clear reason + **Retry** + optional “Try another file” |

Retry must resume or re-queue without forcing the user to re-select the file when the blob is already held. Never lose the user’s selection silently.

## 6. Errors — clear, actionable, non-technical

| Do | Don’t |
|----|-------|
| “We couldn’t connect to Google Drive. Check your connection and try again.” | `OAuthError: invalid_grant 401` |
| “This PDF looks password-protected. Upload an unlocked copy.” | Stack traces, Edge Function names |
| Offer a next step (Retry, Fix settings, Contact support) | Dead-end alert with only OK |

Map server codes to copy in a shared error catalogue (`shared/lib/errors`). Log technical detail to observability; show human copy in UI.

## 7. Form draft auto-save

Where appropriate (settings, review sheets, onboarding, long capture metadata, trip editors):

- Debounced auto-save (≈500–1000ms) or save-on-blur
- Visible draft status: “Saving…” → “Saved” → timestamp
- Restore drafts after refresh / crash
- Do **not** auto-save credentials or one-shot confirmation fields
- Conflict: last-write-wins with toast if remote changed; never silent overwrite of confirmed evidence fields

Drafts live in durable storage (Supabase or equivalent) for signed-in users; `localStorage` only as a short-lived offline buffer with sync.

## 8. Undo where practical

| Action class | Undo approach |
|--------------|---------------|
| Soft delete / archive | Toast with Undo (30–60s) reversing soft-delete |
| Category / tag change | Undo restores previous values |
| Accept AI suggestion | Undo reverts to prior confirmed state |
| Hard irreversible | No fake undo — confirmation only + support path |

Undo must be a real revert via API, not UI-only.

## Shared components (required)

Implement once in the design system / `shared/components`:

- `PageSkeleton` / `ListSkeleton` / `CardSkeleton`
- `EmptyState`
- `ConfirmDialog` (destructive variant)
- `JobProgress` / `UploadStatus`
- `ErrorBanner` / toast error with action
- `DraftStatus`
- `UndoToast`

Features compose these; they do not reimplement them.
