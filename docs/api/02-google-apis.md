# Google APIs

## Sign-in

Handled by **Supabase Auth Google provider**. Scopes limited to profile/email for sign-in.

## Drive connection (incremental)

Additional scopes when user connects Drive, e.g.:

- `https://www.googleapis.com/auth/drive.file` (preferred least privilege — files opened/created by app)
- Broader drive readonly only if product requires arbitrary file pick beyond drive.file constraints; document privacy impact if expanded

## Google Picker

- Loaded client-side with API key + OAuth token
- Developer key restricted by HTTP referrer
- Picker returns file ids → submitted to `drive-import`

## Server usage

Edge Function uses stored refresh token to:

1. `files.get` / export media
2. Stream to Vercel Blob
3. Never log file contents

## Disconnect

Revoke tokens with Google where possible; mark `integration_accounts.status = revoked`.
