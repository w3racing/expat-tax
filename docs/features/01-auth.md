# Auth & session

## Purpose

Let users sign in securely with Google and maintain a stable session across devices.

## Flows

1. Land on marketing/sign-in → **Continue with Google**
2. Supabase OAuth → redirect to `/` or `/onboarding`
3. Session refresh handled by Supabase client
4. Sign out clears session and Query cache

## Rules

- Unauthenticated users only see public routes
- Protected routes redirect to sign-in with `returnTo`
- Google Drive connection is **not** implied by sign-in (incremental scopes later)

## Acceptance

- Sign-in works on iOS Safari, Android Chrome, desktop
- Session survives refresh
- Sign-out is immediate and complete
