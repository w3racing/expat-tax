# Google Drive integration

## Purpose

Make Google Drive a first-class part of the Evidence Vault so the user always has their own organised copy of every evidence file.

## Flows

### 1. Vault bootstrap

1. Connect Google with Drive scopes
2. Create `AJX ATO` root and managed folder tree
3. Persist every managed folder id
4. Store changes cursor for ongoing sync

### 2. Upload mirroring

1. User uploads or captures a file
2. App stores the binary in Blob and metadata in Supabase
3. App mirrors the file to the correct managed Drive folder
4. Persist `drive_file_id`
5. Ingest queued; folder may be corrected after classification

### 3. Existing Drive import

1. Open Picker → select files
2. Edge Function downloads and stores into Vercel Blob
3. Evidence rows created
4. File is normalised into the managed folder structure
5. Same evidence and sync pipeline continues

### 4. Ongoing sync

Drive changes are consumed continuously to detect:

- rename
- replace / new revision
- delete / trash
- restore
- move outside managed folder policy

## Rules

- Sign-in Google ≠ Drive connected
- Show connected account email and vault health
- Handle token refresh server-side
- Store every managed folder id and every mirrored `drive_file_id`
- Respect per-user import and sync quotas
- Never permanently delete evidence because of a Drive deletion event
- If users rename files in Drive, preserve the id and sync the name back
- If users replace files in Drive, create a new vault revision instead of silent overwrite

## Acceptance

- Works on desktop and mobile browsers that support Picker
- Automatically provisions the full AJX Drive folder tree
- Every evidence file exists in metadata, Blob, and user Drive
- Clear error if scope missing or sync attention is required
- Provenance shows Drive file id and original file name
