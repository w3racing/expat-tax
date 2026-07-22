# ADR-009: Async AI processing

## Status

Accepted

## Context

OCR, classification, and extraction are too slow and failure-prone to run inline with capture.

## Decision

Capture returns immediately after durable store + DB row. **Edge Functions** process asynchronously. Status: `uploaded → processing → needs_review | ready | failed`. **Vercel Cron** recovers stuck jobs and recomputes readiness.

## Consequences

- UI must show processing states elegantly
- Idempotent workers required
- Model provider choice can change behind the function boundary
