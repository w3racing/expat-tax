# ADR-003: Auth via Supabase Auth + Google OAuth

## Status

Accepted

## Context

Target users already live in Google (Drive, Gmail). Google sign-in reduces friction and unlocks Drive import.

## Decision

**Supabase Auth** with **Google OAuth** as the primary sign-in method. Google Drive scopes requested only when the user connects Drive (incremental authorisation).

## Consequences

- Separate “Sign in with Google” from “Connect Google Drive”
- Store provider tokens server-side for Drive operations
- Account linking edge cases documented in auth feature spec
