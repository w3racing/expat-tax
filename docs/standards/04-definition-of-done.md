# Definition of done

A feature or screen is not done until **all** applicable items pass. Use this checklist in PRs and feature specs.

## Commercial product bar

- [ ] Answers **yes** to all four: simpler tax prep · less effort · more trust · more audit-ready ([05-commercial-product-bar.md](./05-commercial-product-bar.md))
- [ ] Would you be **proud to show this screen to another professional pilot**?
- [ ] No unnecessary complexity; deferred capabilities are clearly “later”, not half-built
- [ ] Feature spec includes **Commercial product bar** + **Standards compliance** / exceptions

## Product UX

- [ ] Skeleton loading for every async region
- [ ] Empty state with illustration, guidance, and CTA (if zero-data possible)
- [ ] Destructive actions use confirm dialog (typing gate if high-impact)
- [ ] Long-running tasks show progress / phase status
- [ ] Uploads show status and support retry on failure
- [ ] Errors use non-technical, actionable copy (+ retry/fix when relevant)
- [ ] Forms auto-save drafts where appropriate; draft status visible
- [ ] Major reversible actions offer undo (toast or equivalent)

## Trust

- [ ] Uploaded documents show processing status end-to-end
- [ ] AI suggestions show confidence + short “why” (when AI ships)
- [ ] Calculated / estimated figures link to source documents or missing-input chips
- [ ] Financial amounts expose audit trail (source, FX, actor, time)

## Engineering

- [ ] Works on phone, tablet, and desktop shells
- [ ] Full keyboard access; focus visible; SR labels on icon-only controls
- [ ] Light and dark themes verified (no hardcoded colours)
- [ ] Lists/search paginated or virtualized; no full-history load
- [ ] Commercial expansion section completed in feature spec
- [ ] No file ≫ ~300 lines; feature boundaries respected

## Copy & calm

- [ ] Voice matches design system (calm, clear, non-blaming, professional)
- [ ] Estimates never presented as lodged tax truth

## Exception process

If an item cannot ship in this iteration:

1. Document in the feature spec under **Standards exceptions**
2. Link a follow-up issue / roadmap item
3. Do not claim “done” for the gated behaviour
