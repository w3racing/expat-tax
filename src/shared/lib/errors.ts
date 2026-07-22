/** Shared error catalogue — map codes to user-facing copy (U6). */

export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_FAILED'
  | 'NETWORK'
  | 'UPLOAD_FAILED'
  | 'IMPORT_INVALID'
  | 'IMPORT_UNSUPPORTED'
  | 'IMPORT_FAILED'
  | 'NOT_FOUND'
  | 'PERMISSION'
  | 'SAVE_FAILED'
  | 'EXPORT_FAILED'
  | 'UNKNOWN'

export type ErrorEntry = {
  code: ErrorCode
  title: string
  description: string
  action?: string
}

const catalogue: Record<ErrorCode, Omit<ErrorEntry, 'code'>> = {
  AUTH_REQUIRED: {
    title: 'Sign in required',
    description: 'Sign in to continue with your tax year.',
    action: 'Sign in',
  },
  AUTH_FAILED: {
    title: 'Could not sign in',
    description: 'Check your connection and try again. If this keeps happening, use email magic link.',
    action: 'Try again',
  },
  NETWORK: {
    title: 'Connection problem',
    description: 'We could not reach AJX Tax. Check your network and retry.',
    action: 'Retry',
  },
  UPLOAD_FAILED: {
    title: 'Upload failed',
    description: 'Your file was not saved. Nothing was lost from previous uploads — try again.',
    action: 'Retry upload',
  },
  IMPORT_INVALID: {
    title: 'Import file not recognised',
    description: 'Use an AJX Tax Backup.json from the Calculator, or a supported evidence export.',
    action: 'Choose another file',
  },
  IMPORT_UNSUPPORTED: {
    title: 'Format not supported yet',
    description: 'This backup type is outside MVP. Export Tax Planner data from the Calculator instead.',
  },
  IMPORT_FAILED: {
    title: 'Import failed',
    description:
      'Nothing partial was left behind. Your previous Tax Position snapshot is intact — retry when ready.',
    action: 'Try again',
  },
  NOT_FOUND: {
    title: 'Nothing here',
    description: 'This item may have been removed or is outside your account.',
    action: 'Go home',
  },
  PERMISSION: {
    title: 'Access denied',
    description: 'You do not have permission for this action.',
  },
  SAVE_FAILED: {
    title: 'Could not save',
    description: 'Your last change was not saved. Check your connection and try again.',
    action: 'Retry',
  },
  EXPORT_FAILED: {
    title: 'Export failed',
    description: 'The accountant package could not be built. Try again in a moment.',
    action: 'Retry export',
  },
  UNKNOWN: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Try again. If it continues, contact support.',
    action: 'Retry',
  },
}

export function getErrorEntry(code: ErrorCode): ErrorEntry {
  return { code, ...catalogue[code] }
}

export function mapUnknownError(error: unknown): ErrorEntry {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code
    if (code in catalogue) {
      return getErrorEntry(code as ErrorCode)
    }
  }
  return getErrorEntry('UNKNOWN')
}
