# ADR-005: TanStack Query + typed Supabase client

## Status

Accepted

## Context

Evidence lists, readiness scores, and processing statuses change often. We need caching, deduplication, and mutation invalidation.

## Decision

Use **TanStack Query** for all server state. Generate or maintain **typed Supabase** database types. Feature hooks own query keys (`['evidence', fy, filters]`).

## Consequences

- No Redux for server data
- Realtime subscriptions update Query cache
- Consistent loading/error patterns via shared query UI helpers
