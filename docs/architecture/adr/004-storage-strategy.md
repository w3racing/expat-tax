# ADR-004: Evidence storage — Vercel Blob + Google Drive

## Status

Accepted

## Context

Evidence binaries must be durable, cheap, and fast to upload from mobile. Users also want to pull existing files from Drive.

## Decision

- **Source of truth for files the app processes:** **Vercel Blob**
- **Google Drive:** import via Picker; **copy into Blob** and keep Drive file id as provenance
- Postgres stores metadata only (paths, hashes, mime, size)

## Consequences

- Users can disconnect Drive without losing imported evidence
- Dual-write complexity during import (Drive fetch → Blob → DB)
- Blob access policy must be designed for private evidence
