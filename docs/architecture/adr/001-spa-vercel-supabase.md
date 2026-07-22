# ADR-001: SPA on Vercel + Supabase

## Status

Accepted

## Context

AJX Tax is a highly interactive, mobile-first evidence capture product. We need fast client UX, file uploads, OAuth, background jobs, and a managed Postgres with RLS.

## Decision

Ship a **Vite + React 19 SPA** hosted on **Vercel**, with **Supabase** as the primary backend (Auth, Postgres, Realtime, Edge Functions). Use **Vercel Cron** and **Vercel Blob** for scheduled jobs and binary storage.

## Consequences

- No Next.js SSR/RSC complexity for v1
- SEO is secondary (app is authenticated)
- Auth is SPA-oriented; protect tokens carefully
- Edge Functions bridge secrets and long-running ingest triggers
