# Capture

## Purpose

The product’s heart: get evidence into the system in one motion. **Every** capture triggers AI processing asynchronously.

## Entry points

- Centre tab / FAB (phone)
- Quick action menu: Camera, Photo library, File upload, Google Drive
- Desktop: shortcut `C`, drag-and-drop onto capture zone
- Tablet: side nav + large drop zone

## Supported file types

- Photos and screenshots (JPEG, PNG, HEIC, WebP)
- PDF (digital and scanned)
- ZIP (batch unpack → multiple evidence items)
- CSV (structured financial exports)
- Email attachments (when ingest path is available)

## Flow

1. User selects source
2. File(s) upload to Blob
3. `evidence_items` created (`status=uploaded`)
4. AI ingest job queued immediately
5. UI shows calm processing state
6. High confidence → `ready` silently; low confidence → `needs_review` sheet

## Multi-file

- Batch upload allowed
- ZIP: each processable member becomes evidence (see AI ingest)
- Multi-page PDF: one evidence item unless user splits

## Acceptance

- Camera works on iPhone Safari / Android
- ZIP and CSV accepted with clear errors when empty or unsupported
- Never waits for AI to confirm capture success
- AI processes every uploaded document without exception
