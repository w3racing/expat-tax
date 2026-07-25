export type ProfileIdentity = {
  id: string
  email: string
  displayName: string
}

export type ProfileDetailsInput = {
  displayName: string
  email: string
}

export type ProfileDetailsResult =
  | { ok: true; user: ProfileIdentity }
  | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Normalize and validate taxpayer name / email for Account settings. */
export function applyProfileDetails(
  current: ProfileIdentity,
  input: ProfileDetailsInput,
  options: { allowEmailEdit: boolean },
): ProfileDetailsResult {
  const displayName = input.displayName.trim()
  if (!displayName) {
    return { ok: false, error: 'Enter your name.' }
  }
  if (displayName.length > 120) {
    return { ok: false, error: 'Name is too long.' }
  }

  let email = current.email
  if (options.allowEmailEdit) {
    email = input.email.trim()
    if (!email) {
      return { ok: false, error: 'Enter your email.' }
    }
    if (!EMAIL_RE.test(email)) {
      return { ok: false, error: 'Enter a valid email address.' }
    }
    if (email.length > 254) {
      return { ok: false, error: 'Email is too long.' }
    }
  }

  return {
    ok: true,
    user: {
      ...current,
      displayName,
      email,
    },
  }
}
